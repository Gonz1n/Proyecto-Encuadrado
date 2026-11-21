from datetime import datetime, timedelta

import pytest
from sqlalchemy import event, select

from app import clock
from app.centers.models import CenterClosure, Role
from app.scheduling.models import AppointmentChange, AppointmentStatus


@pytest.fixture
def setup(membership_factory, auth_client):
    def make(role):
        membership = membership_factory(role=role)
        return membership, auth_client(membership.user)

    return make


def url(center, suffix=""):
    return f"/api/centers/{center.slug}/closures/{suffix}"


def future_day(days=10):
    return clock.local_today() + timedelta(days=days)


def at(day, hour):
    return datetime.combine(day, datetime.min.time()).replace(hour=hour)


def test_admin_creates_closure_and_cancels_day(setup, service_factory, appointment_factory, session):
    admin, client = setup(Role.ADMIN)
    service = service_factory(center=admin.center)
    day = future_day()
    first = appointment_factory(admin, service, at(day, 10))
    second = appointment_factory(admin, service, at(day, 11))
    response = client.post(url(admin.center), json={"date": day.isoformat(), "reason": "Feriado"})
    assert response.status_code == 201
    body = response.json()
    assert body["date"] == day.isoformat()
    assert body["reason"] == "Feriado"
    assert body["cancelled_appointments"] == 2
    for appointment in (first, second):
        session.refresh(appointment)
        assert appointment.status == AppointmentStatus.CANCELLED
    change = session.scalars(select(AppointmentChange).where(AppointmentChange.appointment_id == first.id)).one()
    assert change.kind == "cancelled"
    assert change.note == "Centro cerrado: Feriado"
    assert change.previous_start == first.start
    assert change.new_start is None
    assert change.changed_by_id == admin.user_id
    closure = session.scalars(select(CenterClosure)).one()
    assert closure.created_by_id == admin.user_id


def test_closure_keeps_past_and_cancelled(setup, service_factory, appointment_factory, session, monkeypatch):
    admin, client = setup(Role.ADMIN)
    service = service_factory(center=admin.center)
    day = future_day()
    other_day = appointment_factory(admin, service, at(day + timedelta(days=1), 10))
    already = appointment_factory(admin, service, at(day, 10), status=AppointmentStatus.CANCELLED)
    past = appointment_factory(admin, service, at(clock.local_today() - timedelta(days=2), 10))
    response = client.post(url(admin.center), json={"date": day.isoformat(), "reason": "Feriado"})
    assert response.json()["cancelled_appointments"] == 0
    session.refresh(other_day)
    session.refresh(past)
    assert other_day.status == AppointmentStatus.CONFIRMED
    assert past.status == AppointmentStatus.CONFIRMED
    assert not session.scalars(select(AppointmentChange).where(AppointmentChange.appointment_id == already.id)).all()


def test_closure_on_today_cancels_only_upcoming(setup, service_factory, appointment_factory, session, monkeypatch):
    admin, client = setup(Role.ADMIN)
    service = service_factory(center=admin.center)
    today = clock.local_today()
    now = at(today, 12)
    monkeypatch.setattr(clock, "local_now", lambda: now)
    monkeypatch.setattr(clock, "local_today", lambda: today)
    earlier = appointment_factory(admin, service, at(today, 9))
    later = appointment_factory(admin, service, at(today, 15))
    response = client.post(url(admin.center), json={"date": today.isoformat(), "reason": "Corte de luz"})
    assert response.status_code == 201
    assert response.json()["cancelled_appointments"] == 1
    session.refresh(earlier)
    session.refresh(later)
    assert earlier.status == AppointmentStatus.CONFIRMED
    assert later.status == AppointmentStatus.CANCELLED


def test_past_date_is_rejected(setup):
    admin, client = setup(Role.ADMIN)
    day = clock.local_today() - timedelta(days=1)
    response = client.post(url(admin.center), json={"date": day.isoformat(), "reason": "Feriado"})
    assert response.status_code == 400
    assert response.json() == {"date": ["La fecha no puede ser pasada"]}


def test_duplicate_closure_is_rejected(setup, closure_factory):
    admin, client = setup(Role.ADMIN)
    day = future_day()
    closure_factory(admin.center, day)
    response = client.post(url(admin.center), json={"date": day.isoformat(), "reason": "Otra vez"})
    assert response.status_code == 400
    assert response.json() == {"date": ["Ese día ya está marcado como cerrado"]}


def test_reason_required_and_max_120(setup):
    admin, client = setup(Role.ADMIN)
    day = future_day().isoformat()
    assert client.post(url(admin.center), json={"date": day}).json() == {"reason": ["Este campo es obligatorio."]}
    assert client.post(url(admin.center), json={"date": day, "reason": "   "}).status_code == 400
    long = client.post(url(admin.center), json={"date": day, "reason": "x" * 121})
    assert long.json() == {"reason": ["Asegúrate de que este campo no tenga más de 120 caracteres."]}
    assert client.post(url(admin.center), json={"date": day, "reason": "x" * 120}).status_code == 201


@pytest.mark.parametrize("role", [Role.MEMBER, Role.VIEWER])
def test_member_and_viewer_cannot_create_or_delete(setup, closure_factory, role):
    membership, client = setup(role)
    closure = closure_factory(membership.center, future_day())
    created = client.post(url(membership.center), json={"date": future_day(11).isoformat(), "reason": "Feriado"})
    deleted = client.delete(url(membership.center, f"{closure.id}/"))
    assert created.status_code == 403
    assert deleted.status_code == 403


@pytest.mark.parametrize("role", [Role.ADMIN, Role.MEMBER, Role.VIEWER])
def test_any_member_lists_upcoming_closures(setup, closure_factory, role):
    membership, client = setup(role)
    today = clock.local_today()
    closure_factory(membership.center, today - timedelta(days=1), "Pasado")
    later = closure_factory(membership.center, today + timedelta(days=9), "Despues")
    sooner = closure_factory(membership.center, today, "Hoy")
    response = client.get(url(membership.center))
    assert response.status_code == 200
    assert response.json() == [
        {"id": sooner.id, "date": today.isoformat(), "reason": "Hoy"},
        {"id": later.id, "date": (today + timedelta(days=9)).isoformat(), "reason": "Despues"},
    ]


def test_delete_closure_does_not_restore(setup, service_factory, appointment_factory, session):
    admin, client = setup(Role.ADMIN)
    service = service_factory(center=admin.center)
    day = future_day()
    appointment = appointment_factory(admin, service, at(day, 10))
    created = client.post(url(admin.center), json={"date": day.isoformat(), "reason": "Feriado"}).json()
    response = client.delete(url(admin.center, f"{created['id']}/"))
    assert response.status_code == 204
    session.refresh(appointment)
    assert appointment.status == AppointmentStatus.CANCELLED
    assert client.get(url(admin.center)).json() == []


def test_delete_closure_of_other_center_is_404(setup, center_factory, closure_factory):
    admin, client = setup(Role.ADMIN)
    foreign = closure_factory(center_factory(), future_day())
    for closure_id in (foreign.id, foreign.id + 999):
        response = client.delete(url(admin.center, f"{closure_id}/"))
        assert response.status_code == 404
        assert response.json() == {"detail": "No encontrado."}


def test_closure_locks_center_professionals(
    setup, membership_factory, service_factory, appointment_factory, session
):
    admin, client = setup(Role.ADMIN)
    other = membership_factory(role=Role.MEMBER, center=admin.center)
    service = service_factory(center=admin.center)
    day = future_day()
    appointment_factory(other, service, at(day, 10))
    statements = []

    def record(conn, cursor, statement, *args):
        statements.append(statement)

    engine = session.get_bind().engine
    event.listen(engine, "before_cursor_execute", record)
    try:
        response = client.post(url(admin.center), json={"date": day.isoformat(), "reason": "Feriado"})
    finally:
        event.remove(engine, "before_cursor_execute", record)
    assert response.status_code == 201
    lock = next(i for i, s in enumerate(statements) if "FROM users" in s and "FOR UPDATE" in s)
    update = next(i for i, s in enumerate(statements) if s.startswith("UPDATE appointments"))
    first_read = next(i for i, s in enumerate(statements) if s.startswith("SELECT") and "FROM appointments" in s)
    assert lock < first_read
    assert lock < update
    assert "ORDER BY users.id" in statements[lock]
