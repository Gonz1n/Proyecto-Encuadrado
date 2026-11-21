from datetime import datetime, time, timedelta

import pytest
from sqlalchemy import event, select

from app import clock
from app.centers.models import Role
from app.scheduling.models import AppointmentChange, AppointmentStatus

LUNCH = {"lunch_start": "13:00", "lunch_end": "14:00"}


@pytest.fixture
def setup(membership_factory, auth_client):
    def make(role=Role.ADMIN, **center):
        membership = membership_factory(role=role)
        for field, value in center.items():
            setattr(membership.center, field, value)
        return membership, auth_client(membership.user)

    return make


def url(center):
    return f"/api/centers/{center.slug}/"


def at(day, hour, minute=0):
    return datetime.combine(day, time(hour, minute))


def future_day(days=10):
    return clock.local_today() + timedelta(days=days)


def test_admin_sets_lunch(setup, session):
    admin, client = setup()
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


@pytest.mark.parametrize("payload", [{"lunch_start": "13:00"}, {"lunch_end": "14:00"}, {"lunch_start": "13:00", "lunch_end": None}])
def test_lunch_requires_both_fields(setup, payload):
    admin, client = setup()
    response = client.patch(url(admin.center), json=payload)
    assert response.status_code == 400
    assert "Indica inicio y término de la colación" in response.text


@pytest.mark.parametrize("payload", [{"lunch_start": "14:00", "lunch_end": "13:00"}, {"lunch_start": "13:00", "lunch_end": "13:00"}])
def test_lunch_end_after_start(setup, payload):
    admin, client = setup()
    response = client.patch(url(admin.center), json=payload)
    assert response.status_code == 400
    assert "El término de la colación debe ser posterior al inicio" in response.text


@pytest.mark.parametrize("payload", [{"lunch_start": "08:00", "lunch_end": "09:30"}, {"lunch_start": "17:00", "lunch_end": "18:30"}])
def test_lunch_inside_opening_hours(setup, payload):
    admin, client = setup()
    response = client.patch(url(admin.center), json=payload)
    assert response.status_code == 400
    assert "La colación debe estar dentro del horario de atención" in response.text


def test_hours_change_leaving_lunch_outside_is_rejected(setup):
    admin, client = setup(lunch_start=time(13, 0), lunch_end=time(14, 0))
    response = client.patch(url(admin.center), json={"closing_time": "13:30"})
    assert response.status_code == 400
    assert "La colación debe estar dentro del horario de atención" in response.text


def test_null_clears_lunch(setup, session):
    admin, client = setup(lunch_start=time(13, 0), lunch_end=time(14, 0))
    response = client.patch(url(admin.center), json={"lunch_start": None, "lunch_end": None})
    assert response.status_code == 200
    assert response.json()["lunch_start"] is None
    assert response.json()["lunch_end"] is None
    assert response.json()["cancelled_appointments"] == 0
    session.refresh(admin.center)
    assert admin.center.lunch_start is None


def test_setting_lunch_cancels_overlapping(setup, service_factory, appointment_factory, session):
    admin, client = setup()
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


def test_patch_without_lunch_change_cancels_nothing(setup, service_factory, appointment_factory, session):
    admin, client = setup(lunch_start=time(13, 0), lunch_end=time(14, 0))
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


def test_member_cannot_set_lunch(setup):
    member, client = setup(Role.MEMBER)
    assert client.patch(url(member.center), json=LUNCH).status_code == 403


def test_lunch_locks_professionals_before_selecting_appointments(setup, service_factory, appointment_factory, session):
    admin, client = setup()
    service = service_factory(center=admin.center, duration_minutes=60)
    appointment_factory(admin, service, at(future_day(), 13))
    session.flush()
    statements = []

    def record(conn, cursor, statement, *args):
        statements.append(statement)

    engine = session.get_bind().engine
    event.listen(engine, "before_cursor_execute", record)
    try:
        response = client.patch(url(admin.center), json=LUNCH)
    finally:
        event.remove(engine, "before_cursor_execute", record)
    assert response.json()["cancelled_appointments"] == 1
    lock = next(i for i, s in enumerate(statements) if "FROM users" in s and "FOR UPDATE" in s)
    select_appointments = next(i for i, s in enumerate(statements) if s.startswith("SELECT") and "FROM appointments" in s)
    update = next(i for i, s in enumerate(statements) if s.startswith("UPDATE"))
    assert lock < select_appointments
    assert lock < update
