from datetime import date, datetime, time, timedelta

import pytest

from app import clock
from app.centers.models import Membership, Role
from app.scheduling.models import Appointment


def day(days):
    return clock.local_today() + timedelta(days=days)


@pytest.fixture
def setup(membership_factory, service_factory, center_factory):
    center = center_factory(opening_time=time(9, 0), closing_time=time(18, 0))
    professional = membership_factory(center=center)
    viewer = membership_factory(role=Role.VIEWER, center=center)
    service = service_factory(center, duration_minutes=60)
    return center, professional, viewer, service


def booking(setup, **overrides):
    center, professional, _, service = setup
    return {
        "service": service.id,
        "professional": professional.id,
        "start": f"{day(1).isoformat()}T10:00",
        "patient_name": "Ana Pérez",
        "patient_email": "ana@example.com",
        "patient_phone": "+56 9 1234 5678",
        "patient_rut": "12.345.678-5",
        "patient_birth_date": "1990-05-14",
        "accept_terms": True,
        "data_consent": True,
        **overrides,
    }


def post(client, setup, body=None, **overrides):
    return client.post(f"/api/public/centers/{setup[0].slug}/appointments/", json=body or booking(setup, **overrides))


def availability(client, setup, d, service=None, professional=None):
    center, prof, _, svc = setup
    return client.get(
        f"/api/public/centers/{center.slug}/availability/",
        params={
            "service": (service or svc).id,
            "professional": (professional or prof).id,
            "date": d.isoformat(),
        },
    )


def stored(session, appointment_id):
    return session.get(Appointment, appointment_id)


def test_public_profile_hides_viewer_and_inactive_services(client, setup, service_factory):
    center, professional, _, _ = setup
    service_factory(center, is_active=False)
    response = client.get(f"/api/public/centers/{center.slug}/")
    body = response.json()
    assert response.status_code == 200
    assert [p["id"] for p in body["professionals"]] == [professional.id]
    assert len(body["services"]) == 1
    assert body["opening_time"] == "09:00"
    assert set(body["professionals"][0]) == {
        "id",
        "full_name",
        "title",
        "university",
        "bio",
        "health_registry",
    }


def test_public_profile_exposes_social_links(client, setup, session):
    center = setup[0]
    center.instagram_url = "https://instagram.com/centroaurora"
    session.flush()
    body = client.get(f"/api/public/centers/{center.slug}/").json()
    assert body["instagram_url"] == "https://instagram.com/centroaurora"
    assert body["website_url"] == ""
    assert body["whatsapp_number"] == ""
    assert body["open_days"] == [0, 1, 2, 3, 4, 5, 6]


def test_unknown_center_slug_returns_404(client):
    response = client.get("/api/public/centers/no-existe/")
    assert response.status_code == 404
    assert response.json() == {"detail": "No encontrado."}


def test_availability_excludes_booked_slot(client, setup, appointment_factory):
    _, professional, _, service = setup
    appointment_factory(professional, service, datetime.combine(day(1), time(10, 0)))
    slots = availability(client, setup, day(1)).json()["slots"]
    assert "09:00" in slots
    assert "09:30" not in slots
    assert "10:00" not in slots
    assert "10:30" not in slots
    assert "11:00" in slots


def test_availability_rejects_inactive_service(client, setup, service_factory):
    inactive = service_factory(setup[0], is_active=False)
    assert availability(client, setup, day(1), service=inactive).status_code == 400


def test_availability_rejects_service_of_other_center(client, setup, service_factory):
    other = service_factory()
    assert availability(client, setup, day(1), service=other).status_code == 400


def test_availability_rejects_date_outside_window(client, setup):
    assert availability(client, setup, day(0)).status_code == 400
    assert availability(client, setup, day(31)).status_code == 400
    assert availability(client, setup, day(30)).status_code == 200


def test_days_lists_only_days_with_free_slots(client, setup, appointment_factory, service_factory):
    center, professional, _, service = setup
    long = service_factory(center, duration_minutes=240)
    for hour in (9, 13, 17):
        appointment_factory(
            professional, long if hour < 17 else service, datetime.combine(day(2), time(hour, 0))
        )
    response = client.get(
        f"/api/public/centers/{center.slug}/availability/days/",
        params={"service": service.id, "professional": professional.id},
    )
    days = response.json()["days"]
    assert day(1).isoformat() in days
    assert day(2).isoformat() not in days
    assert day(0).isoformat() not in days


def test_public_booking_creates_appointment(client, setup, session):
    response = post(client, setup)
    body = response.json()
    assert response.status_code == 201
    assert body["start"] == f"{day(1).isoformat()}T10:00"
    assert body["end"] == f"{day(1).isoformat()}T11:00"
    assert body["center"]["slug"] == setup[0].slug
    assert body["service"]["price_clp"] == 20000
    appointment = stored(session, body["id"])
    assert appointment.patient_phone == "+56912345678"
    assert appointment.patient_rut == "12.345.678-5"
    assert appointment.patient_birth_date == date(1990, 5, 14)
    assert appointment.end - appointment.start == timedelta(minutes=60)
    assert appointment.terms_accepted_at is not None
    assert appointment.data_consent_at == appointment.terms_accepted_at


def test_second_booking_of_same_slot_returns_409(client, setup):
    assert post(client, setup).status_code == 201
    response = post(client, setup)
    assert response.status_code == 409
    assert response.json() == {"detail": "La hora seleccionada ya no está disponible"}


def test_off_grid_start_returns_409(client, setup):
    assert post(client, setup, start=f"{day(1).isoformat()}T10:10").status_code == 409


def test_booking_with_viewer_as_professional_returns_400(client, setup):
    response = post(client, setup, professional=setup[2].id)
    assert response.status_code == 400
    assert response.json()["professional"] == ["El profesional no está disponible"]


@pytest.mark.parametrize("phone", ["12345", "+56 9 ١٢٣٤ ٥٦٧٨"])
def test_invalid_phone_returns_400(client, setup, phone):
    response = post(client, setup, patient_phone=phone)
    assert response.status_code == 400
    assert "patient_phone" in response.json()


def test_changing_service_duration_keeps_existing_end(client, setup, session):
    body = post(client, setup).json()
    service = setup[3]
    service.duration_minutes = 90
    session.flush()
    assert stored(session, body["id"]).end == datetime.combine(day(1), time(11, 0))
    slots = availability(client, setup, day(1)).json()["slots"]
    assert "11:00" in slots
    assert "17:00" not in slots
    assert "16:30" in slots


def test_booking_in_one_center_blocks_same_user_in_another(
    client, setup, session, center_factory, service_factory, appointment_factory
):
    _, professional, _, service = setup
    other_center = center_factory(opening_time=time(9, 0), closing_time=time(18, 0))
    other_membership = Membership(user=professional.user, center=other_center)
    session.add(other_membership)
    session.flush()
    other_service = service_factory(other_center, duration_minutes=60)
    appointment_factory(professional, service, datetime.combine(day(1), time(10, 0)))
    other = (other_center, other_membership, None, other_service)
    slots = availability(client, other, day(1)).json()["slots"]
    assert "10:00" not in slots
    assert "11:00" in slots
    assert post(client, other).status_code == 409


@pytest.mark.parametrize("phone", ["912345678", "9 1234 5678", "56912345678"])
def test_phone_without_country_code_is_normalized(client, setup, session, phone):
    response = post(client, setup, patient_phone=phone)
    assert response.status_code == 201
    assert stored(session, response.json()["id"]).patient_phone == "+56912345678"


@pytest.mark.parametrize(
    "rut,expected",
    [
        ("123456785", "12.345.678-5"),
        ("12345678-5", "12.345.678-5"),
        ("12.345.678-5", "12.345.678-5"),
        (" 12.345.678-5 ", "12.345.678-5"),
        ("10.000.013-k", "10.000.013-K"),
    ],
)
def test_rut_is_normalized(client, setup, session, rut, expected):
    response = post(client, setup, patient_rut=rut)
    assert response.status_code == 201
    assert stored(session, response.json()["id"]).patient_rut == expected


@pytest.mark.parametrize("rut", ["12.345.678-9", "abc", "", "1-8"])
def test_invalid_rut_returns_400(client, setup, rut):
    response = post(client, setup, patient_rut=rut)
    assert response.status_code == 400
    assert "patient_rut" in response.json()


def test_birth_date_cannot_be_future_or_too_old(client, setup):
    future = post(client, setup, patient_birth_date=day(1).isoformat())
    assert future.status_code == 400
    assert future.json()["patient_birth_date"] == ["La fecha de nacimiento no puede ser futura"]
    old = post(client, setup, patient_birth_date="1890-01-01")
    assert old.status_code == 400
    assert old.json()["patient_birth_date"] == ["Revisa la fecha de nacimiento"]


def test_rut_and_birth_date_are_required(client, setup):
    body = booking(setup)
    del body["patient_rut"], body["patient_birth_date"]
    response = post(client, setup, body)
    assert response.status_code == 400
    assert {"patient_rut", "patient_birth_date"} <= set(response.json())


@pytest.mark.parametrize("extra,modality", [({}, "in_person"), ({"modality": "remote"}, "remote")])
def test_booking_modality_defaults_to_in_person(client, setup, session, extra, modality):
    response = post(client, setup, **extra)
    assert response.status_code == 201
    assert response.json()["modality"] == modality
    assert stored(session, response.json()["id"]).modality == modality


def test_invalid_modality_returns_400(client, setup):
    response = post(client, setup, modality="telepatia")
    assert response.status_code == 400
    assert "modality" in response.json()


def test_start_with_seconds_or_timezone_is_rejected(client, setup):
    for bad in ["2026-12-01T10:00:00", "2026-12-01T10:00Z", "2026-12-01T10:00-03:00"]:
        response = post(client, setup, start=bad)
        assert response.status_code == 400
        assert "start" in response.json()


def test_non_integer_ids_are_invalid(client, setup):
    assert post(client, setup, service="abc").json()["service"] == ["El servicio no es válido"]
    assert post(client, setup, professional="abc").json()["professional"] == ["El profesional no es válido"]


def test_booking_locks_professional_row(client, setup, capture_sql):
    with capture_sql() as statements:
        assert post(client, setup).status_code == 201
    assert any("FROM users" in s and "FOR UPDATE" in s for s in statements)


def test_out_of_range_ids_are_unavailable(client, setup):
    huge = 99999999999999999999
    center, professional, _, service = setup
    response = client.get(
        f"/api/public/centers/{center.slug}/availability/days/",
        params={"service": huge, "professional": professional.id},
    )
    assert response.status_code == 400
    assert response.json() == {"service": ["El servicio no está disponible"]}
    response = post(client, setup, service=huge)
    assert response.status_code == 400
    assert response.json() == {"service": ["El servicio no está disponible"]}
    response = post(client, setup, professional=huge)
    assert response.json() == {"professional": ["El profesional no está disponible"]}


def test_invalid_email_message_is_spanish(client, setup):
    response = post(client, setup, patient_email="nope")
    assert response.status_code == 400
    assert response.json() == {"patient_email": ["Ingresa un correo electrónico válido."]}


TERMS_ERROR = "Debes aceptar los términos y condiciones"
CONSENT_ERROR = "Debes autorizar el tratamiento de tus datos personales"


@pytest.mark.parametrize("field,error", [("accept_terms", TERMS_ERROR), ("data_consent", CONSENT_ERROR)])
@pytest.mark.parametrize("value", [False, "missing"])
def test_booking_requires_checkboxes(client, setup, field, error, value):
    body = booking(setup, **{field: value})
    if value == "missing":
        del body[field]
    response = post(client, setup, body)
    assert response.status_code == 400
    assert response.json() == {field: [error]}


def test_booking_reports_both_checkboxes_with_other_errors(client, setup):
    response = post(client, setup, accept_terms=False, data_consent=False, patient_rut="x")
    assert response.status_code == 400
    body = response.json()
    assert body["accept_terms"] == [TERMS_ERROR]
    assert body["data_consent"] == [CONSENT_ERROR]
    assert "patient_rut" in body
