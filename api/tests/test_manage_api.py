from datetime import datetime, time, timedelta

import pytest
from sqlalchemy import func, select

from app import clock
from app.centers.models import Role
from app.scheduling.models import AppointmentChange, AppointmentStatus, ChangeKind
from app.scheduling.services import (
    AppointmentLocked,
    AppointmentNotFound,
    SlotUnavailable,
    cancel_appointment,
    reschedule_appointment,
)

FORMAT = "%Y-%m-%dT%H:%M"
LOCKED = "No se puede modificar una cita pasada"
BUSY = "La hora seleccionada ya no está disponible"


def at(days, hour=10, minute=0):
    return datetime.combine(clock.local_today() + timedelta(days=days), time(hour, minute))


@pytest.fixture
def setup(membership_factory, service_factory, appointment_factory):
    admin = membership_factory(role=Role.ADMIN)
    center = admin.center
    member_a = membership_factory(center=center)
    member_b = membership_factory(center=center)
    viewer = membership_factory(role=Role.VIEWER, center=center)
    service = service_factory(center)
    appointment = appointment_factory(member_a, service, at(1, 10))
    return center, admin, member_a, member_b, viewer, service, appointment


def changes(session):
    return session.scalar(select(func.count()).select_from(AppointmentChange))


def detail(center, appointment):
    return f"/api/centers/{center.slug}/appointments/{appointment.id}/"


def cancel_url(center, appointment):
    return detail(center, appointment) + "cancel/"


def move(client, center, appointment, start, **extra):
    return client.patch(detail(center, appointment), json={"start": start.strftime(FORMAT), **extra})


def test_admin_reschedules_any_appointment(setup, auth_client, session):
    center, admin, _, _, _, service, appointment = setup
    response = move(auth_client(admin.user), center, appointment, at(1, 15))
    assert response.status_code == 200
    assert response.json()["start"] == at(1, 15).strftime(FORMAT)
    session.refresh(appointment)
    assert appointment.end == at(1, 15) + timedelta(minutes=service.duration_minutes)
    change = session.scalars(select(AppointmentChange)).one()
    assert change.kind == ChangeKind.RESCHEDULED
    assert change.previous_start == at(1, 10)
    assert change.new_start == at(1, 15)
    assert change.changed_by_id == admin.user.id


def test_member_reschedules_own_appointment(setup, auth_client):
    center, _, member_a, _, _, _, appointment = setup
    assert move(auth_client(member_a.user), center, appointment, at(1, 16)).status_code == 200


def test_member_cannot_touch_other_professionals_appointment(setup, auth_client, session):
    center, _, _, member_b, _, _, appointment = setup
    client = auth_client(member_b.user)
    assert move(client, center, appointment, at(1, 16)).status_code == 404
    assert client.post(cancel_url(center, appointment), json={}).status_code == 404
    session.refresh(appointment)
    assert appointment.start == at(1, 10)
    assert appointment.status == AppointmentStatus.CONFIRMED
    assert changes(session) == 0


def test_viewer_cannot_reschedule_or_cancel(setup, auth_client):
    center, _, _, _, viewer, _, appointment = setup
    client = auth_client(viewer.user)
    assert move(client, center, appointment, at(1, 16)).status_code == 403
    assert client.post(cancel_url(center, appointment), json={}).status_code == 403


def test_non_member_gets_404_and_anonymous_401(setup, auth_client, client, user_factory):
    center, _, _, _, _, _, appointment = setup
    assert move(auth_client(user_factory()), center, appointment, at(1, 16)).status_code == 404
    assert move(client, center, appointment, at(1, 16)).status_code == 401


def test_reschedule_to_busy_slot_returns_409(setup, auth_client, appointment_factory, session):
    center, admin, member_a, _, _, service, appointment = setup
    appointment_factory(member_a, service, at(1, 15))
    response = move(auth_client(admin.user), center, appointment, at(1, 15))
    assert response.status_code == 409
    assert response.json() == {"detail": BUSY}
    assert changes(session) == 0


def test_reschedule_to_same_or_self_overlapping_slot_is_allowed(setup, auth_client, session):
    center, admin, _, _, _, _, appointment = setup
    client = auth_client(admin.user)
    assert move(client, center, appointment, at(1, 10, 30)).status_code == 200
    assert move(client, center, appointment, at(1, 10)).status_code == 200
    assert changes(session) == 2


def test_reschedule_blocked_by_same_person_in_other_center(
    setup, auth_client, membership_factory, service_factory, appointment_factory
):
    center, admin, member_a, _, _, _, appointment = setup
    other = membership_factory(user=member_a.user)
    appointment_factory(other, service_factory(other.center), at(1, 15))
    assert move(auth_client(admin.user), center, appointment, at(1, 15)).status_code == 409


def test_reschedule_to_same_start_writes_no_history(setup, auth_client, session):
    center, admin, _, _, _, _, appointment = setup
    assert move(auth_client(admin.user), center, appointment, at(1, 10)).status_code == 200
    assert changes(session) == 0


def test_reschedule_respects_injected_now(setup, session):
    _, admin, _, _, _, _, appointment = setup
    appointment.start = at(2, 10)
    appointment.end = at(2, 10, 30)
    session.flush()
    now = at(1, 12)
    with pytest.raises(SlotUnavailable):
        reschedule_appointment(session, appointment, at(1, 9), "", admin.user, now)
    assert reschedule_appointment(session, appointment, at(1, 15), "", admin.user, now).start == at(1, 15)


def test_in_progress_appointment_is_locked(setup, session):
    _, admin, _, _, _, _, appointment = setup
    with pytest.raises(AppointmentLocked):
        reschedule_appointment(session, appointment, at(2, 10), "", admin.user, appointment.start)
    with pytest.raises(AppointmentLocked):
        cancel_appointment(session, appointment, "", admin.user, appointment.start)


def test_cancel_with_stale_instance_raises_does_not_exist(setup, session):
    _, admin, _, _, _, _, appointment = setup
    now = at(0, 8)
    cancel_appointment(session, appointment, "", admin.user, now)
    with pytest.raises(AppointmentNotFound):
        cancel_appointment(session, appointment, "", admin.user, now)
    assert changes(session) == 1


def test_reschedule_outside_window_returns_400(setup, auth_client):
    center, admin, _, _, _, _, appointment = setup
    response = move(auth_client(admin.user), center, appointment, at(31, 10))
    assert response.status_code == 400
    assert "start" in response.json()


def test_cancel_sets_status_and_records_change_with_note(setup, auth_client, session):
    center, admin, _, _, _, _, appointment = setup
    response = auth_client(admin.user).post(cancel_url(center, appointment), json={"note": "Tengo un congreso"})
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
    change = session.scalars(select(AppointmentChange)).one()
    assert change.kind == ChangeKind.CANCELLED
    assert change.new_start is None
    assert change.previous_start == at(1, 10)
    assert change.note == "Tengo un congreso"
    assert change.changed_by_id == admin.user.id


def test_cancel_twice_returns_404_and_single_change(setup, auth_client, session):
    center, admin, _, _, _, _, appointment = setup
    client = auth_client(admin.user)
    assert client.post(cancel_url(center, appointment), json={}).status_code == 200
    assert client.post(cancel_url(center, appointment), json={}).status_code == 404
    assert changes(session) == 1


def test_past_appointment_cannot_be_modified(setup, auth_client, appointment_factory, session):
    center, admin, member_a, _, _, service, _ = setup
    past = appointment_factory(member_a, service, at(-1, 10))
    client = auth_client(admin.user)
    for response in (
        move(client, center, past, at(1, 16)),
        client.post(cancel_url(center, past), json={}),
    ):
        assert response.status_code == 400
        assert response.json() == {"detail": LOCKED}
    assert changes(session) == 0


def test_note_longer_than_300_returns_400(setup, auth_client):
    center, admin, _, _, _, _, appointment = setup
    client = auth_client(admin.user)
    assert move(client, center, appointment, at(1, 16), note="x" * 301).status_code == 400
    response = client.post(cancel_url(center, appointment), json={"note": "x" * 301})
    assert response.status_code == 400


def test_invalid_body_on_missing_appointment_returns_404(setup, auth_client, session):
    center, admin, member_a, _, _, _, appointment = setup
    client = auth_client(admin.user)
    assert client.patch(detail(center, appointment).replace(str(appointment.id), "0"), json={}).status_code == 404
    appointment.status = AppointmentStatus.CANCELLED
    session.flush()
    assert client.patch(detail(center, appointment), json={}).status_code == 404


def test_cancelled_slot_becomes_available_again(setup, auth_client, client):
    center, admin, member_a, _, _, service, appointment = setup
    params = {"service": service.id, "professional": member_a.id, "date": at(1).date().isoformat()}
    public = f"/api/public/centers/{center.slug}/availability/"
    assert "10:00" not in client.get(public, params=params).json()["slots"]
    auth_client(admin.user).post(cancel_url(center, appointment), json={})
    assert "10:00" in client.get(public, params=params).json()["slots"]


def availability_url(center, appointment):
    return detail(center, appointment) + "availability/"


def test_appointment_availability_excludes_own_appointment_from_busy(setup, auth_client):
    center, admin, _, _, _, _, appointment = setup
    client = auth_client(admin.user)
    response = client.get(availability_url(center, appointment), params={"date": at(1).date().isoformat()})
    assert response.status_code == 200
    assert response.json()["date"] == at(1).date().isoformat()
    assert "10:00" in response.json()["slots"]
    assert client.get(availability_url(center, appointment), params={"date": "x"}).status_code == 400
    assert client.get(availability_url(center, appointment)).status_code == 400
    far = (clock.local_today() + timedelta(days=31)).isoformat()
    assert client.get(availability_url(center, appointment), params={"date": far}).status_code == 400
    days = client.get(availability_url(center, appointment) + "days/")
    assert at(1).date().isoformat() in days.json()["days"]


def test_appointment_availability_includes_today(setup, auth_client, monkeypatch):
    center, admin, _, _, _, _, appointment = setup
    today = clock.local_today()
    morning = datetime.combine(today, time(8, 0))
    monkeypatch.setattr(clock, "local_now", lambda: morning)
    monkeypatch.setattr(clock, "local_today", lambda: today)
    response = auth_client(admin.user).get(availability_url(center, appointment) + "days/")
    assert today.isoformat() in response.json()["days"]


def test_availability_of_cancelled_appointment_returns_404(setup, auth_client, session):
    center, admin, _, _, _, _, appointment = setup
    appointment.status = AppointmentStatus.CANCELLED
    session.flush()
    client = auth_client(admin.user)
    assert client.get(availability_url(center, appointment) + "days/").status_code == 404
    response = client.get(availability_url(center, appointment), params={"date": at(1).date().isoformat()})
    assert response.status_code == 404


def test_appointment_availability_permissions(setup, auth_client):
    center, _, _, member_b, viewer, _, appointment = setup
    days = availability_url(center, appointment) + "days/"
    other = auth_client(member_b.user)
    assert auth_client(viewer.user).get(days).status_code == 403
    assert other.get(days).status_code == 404
    assert other.get(availability_url(center, appointment), params={"date": at(1).date().isoformat()}).status_code == 404
