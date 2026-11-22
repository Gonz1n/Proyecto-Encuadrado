from datetime import datetime, time, timedelta

import pytest
from sqlalchemy import select

from app.centers.constants.roles import Role
from app.core import clock
from app.scheduling.models import AppointmentChange, AppointmentStatus

LUNCH = {"lunch_start": "13:00", "lunch_end": "14:00"}


def url(center):
    return f"/api/centers/{center.slug}/"


def at(day, hour, minute=0):
    return datetime.combine(day, time(hour, minute))


def future_day(days=10):
    return clock.local_today() + timedelta(days=days)


def test_admin_sets_lunch(staff, session):
    admin, client = staff()
    response = client.patch(url(admin.center), json=LUNCH)
    assert response.status_code == 200
    body = response.json()
    assert body["lunch_start"] == "13:00"
    assert body["lunch_end"] == "14:00"
    assert body["cancelled_appointments"] == 0
    session.refresh(admin.center)
    assert admin.center.lunch_start == time(13, 0)
    got = client.get(url(admin.center)).json()
    assert got["lunch_start"] == "13:00"
    assert "cancelled_appointments" not in got


PAIR = "Indica inicio y término de la colación"
ORDER = "El término de la colación debe ser posterior al inicio"
RANGE = "La colación debe estar dentro del horario de atención"


@pytest.mark.parametrize(
    "payload,message",
    [
        ({"lunch_start": "13:00"}, PAIR),
        ({"lunch_end": "14:00"}, PAIR),
        ({"lunch_start": "13:00", "lunch_end": None}, PAIR),
        ({"lunch_start": "14:00", "lunch_end": "13:00"}, ORDER),
        ({"lunch_start": "13:00", "lunch_end": "13:00"}, ORDER),
        ({"lunch_start": "08:00", "lunch_end": "09:30"}, RANGE),
        ({"lunch_start": "17:00", "lunch_end": "18:30"}, RANGE),
    ],
)
def test_invalid_lunch_is_rejected(staff, payload, message):
    admin, client = staff()
    response = client.patch(url(admin.center), json=payload)
    assert response.status_code == 400
    assert message in response.text


def test_hours_change_leaving_lunch_outside_is_rejected(staff):
    admin, client = staff(lunch_start=time(13, 0), lunch_end=time(14, 0))
    response = client.patch(url(admin.center), json={"closing_time": "13:30"})
    assert response.status_code == 400
    assert RANGE in response.text


def test_null_clears_lunch(staff, session):
    admin, client = staff(lunch_start=time(13, 0), lunch_end=time(14, 0))
    response = client.patch(url(admin.center), json={"lunch_start": None, "lunch_end": None})
    assert response.status_code == 200
    assert response.json()["lunch_start"] is None
    assert response.json()["lunch_end"] is None
    assert response.json()["cancelled_appointments"] == 0
    session.refresh(admin.center)
    assert admin.center.lunch_start is None


def test_setting_lunch_cancels_overlapping(staff, service_factory, appointment_factory, session):
    admin, client = staff()
    service = service_factory(center=admin.center, duration_minutes=60)
    day = future_day()
    inside = appointment_factory(admin, service, at(day, 13))
    straddling = appointment_factory(admin, service, at(day, 12, 30))
    before = appointment_factory(admin, service, at(day, 12))
    after = appointment_factory(admin, service, at(day, 14))
    other_day = appointment_factory(admin, service, at(day + timedelta(days=1), 10))
    past = appointment_factory(admin, service, at(clock.local_today() - timedelta(days=2), 13))
    response = client.patch(url(admin.center), json=LUNCH)
    assert response.json()["cancelled_appointments"] == 2
    for appointment in (inside, straddling):
        session.refresh(appointment)
        assert appointment.status == AppointmentStatus.CANCELLED
        change = session.scalars(select(AppointmentChange).where(AppointmentChange.appointment_id == appointment.id)).one()
        assert change.note == "Cancelada por colación del centro"
        assert change.changed_by_id == admin.user_id
    for appointment in (before, after, other_day, past):
        session.refresh(appointment)
        assert appointment.status == AppointmentStatus.CONFIRMED


def test_patch_without_lunch_change_cancels_nothing(staff, service_factory, appointment_factory, session):
    admin, client = staff(lunch_start=time(13, 0), lunch_end=time(14, 0))
    service = service_factory(center=admin.center, duration_minutes=60)
    appointment = appointment_factory(admin, service, at(future_day(), 13))
    response = client.patch(url(admin.center), json={"name": "Otro", **LUNCH})
    assert response.json()["cancelled_appointments"] == 0
    session.refresh(appointment)
    assert appointment.status == AppointmentStatus.CONFIRMED


def test_public_profile_exposes_lunch(client, center_factory):
    center = center_factory(lunch_start=time(13, 0), lunch_end=time(14, 0))
    other = center_factory()
    body = client.get(f"/api/public/centers/{center.slug}/").json()
    assert body["lunch_start"] == "13:00"
    assert body["lunch_end"] == "14:00"
    body = client.get(f"/api/public/centers/{other.slug}/").json()
    assert body["lunch_start"] is None
    assert body["lunch_end"] is None


def test_member_cannot_set_lunch(staff):
    member, client = staff(Role.MEMBER)
    assert client.patch(url(member.center), json=LUNCH).status_code == 403


def test_lunch_locks_professionals_before_selecting_appointments(staff, service_factory, appointment_factory, capture_sql):
    admin, client = staff()
    service = service_factory(center=admin.center, duration_minutes=60)
    appointment_factory(admin, service, at(future_day(), 13))
    with capture_sql() as statements:
        response = client.patch(url(admin.center), json=LUNCH)
    assert response.json()["cancelled_appointments"] == 1
    lock = next(i for i, s in enumerate(statements) if "FROM users" in s and "FOR UPDATE" in s)
    select_appointments = next(i for i, s in enumerate(statements) if s.startswith("SELECT") and "FROM appointments" in s)
    update = next(i for i, s in enumerate(statements) if s.startswith("UPDATE"))
    assert lock < select_appointments
    assert lock < update
