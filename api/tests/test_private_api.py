import re
from datetime import datetime, time, timedelta

import pytest
from sqlalchemy import event, select

from app import clock
from app.centers.models import Role
from app.scheduling.models import Appointment, AppointmentChange, ChangeKind

FORMAT = "%Y-%m-%dT%H:%M"


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
    appointment_factory(member_a, service, at(1, 10))
    appointment_factory(member_b, service, at(1, 11))
    return center, admin, member_a, member_b, viewer


def url(center):
    return f"/api/centers/{center.slug}/appointments/"


def test_member_sees_only_own_appointments(setup, auth_client):
    center, _, member_a, member_b, _ = setup
    response = auth_client(member_a.user).get(url(center), params={"professional": member_b.id})
    assert response.status_code == 200
    assert [a["professional"]["id"] for a in response.json()] == [member_a.id]


def test_admin_sees_all_and_filters_by_professional(setup, auth_client):
    center, admin, member_a, _, _ = setup
    client = auth_client(admin.user)
    assert len(client.get(url(center)).json()) == 2
    filtered = client.get(url(center), params={"professional": member_a.id}).json()
    assert [a["professional"]["id"] for a in filtered] == [member_a.id]
    body = filtered[0]
    assert body["start"] == at(1, 10).strftime(FORMAT)
    assert body["service"]["price_clp"] == 20000
    assert body["patient_phone"] == "+56912345678"
    assert body["modality"] == "in_person"


def test_viewer_sees_all_appointments(setup, auth_client):
    center, _, _, _, viewer = setup
    assert len(auth_client(viewer.user).get(url(center)).json()) == 2


def test_invalid_query_params_return_400(setup, auth_client):
    center, admin, *_ = setup
    assert auth_client(admin.user).get(url(center), params={"from": "nope"}).status_code == 400


def test_appointments_of_other_center_return_404(setup, auth_client, membership_factory):
    center, *_ = setup
    outsider = membership_factory()
    assert auth_client(outsider.user).get(url(center)).status_code == 404


def test_appointments_without_token_return_401(setup, client):
    center, *_ = setup
    assert client.get(url(center)).status_code == 401


def test_list_hides_cancelled_by_default_and_shows_with_param(setup, auth_client, appointment_factory, service_factory):
    center, admin, member_a, _, _ = setup
    appointment_factory(member_a, service_factory(center), at(2, 10), status="cancelled")
    client = auth_client(admin.user)
    assert len(client.get(url(center)).json()) == 2
    assert len(client.get(url(center), params={"include_cancelled": "yes"}).json()) == 2
    shown = client.get(url(center), params={"include_cancelled": "true"}).json()
    assert [a["status"] for a in shown] == ["confirmed", "confirmed", "cancelled"]
    own = auth_client(member_a.user).get(url(center), params={"include_cancelled": "true"}).json()
    assert len(own) == 2


def make_changes(session, appointment, count, user):
    for n in range(count):
        session.add(
            AppointmentChange(
                appointment_id=appointment.id,
                kind=ChangeKind.RESCHEDULED,
                previous_start=at(1, 10),
                new_start=at(2 + n, 10),
                note=f"n{n}",
                changed_by_id=user.id,
                created_at=clock.local_now() + timedelta(seconds=n),
            )
        )
    session.flush()


def test_list_returns_changes_newest_first(setup, auth_client, session):
    center, admin, member_a, _, _ = setup
    appointment = session.scalar(select(Appointment).where(Appointment.professional_id == member_a.id))
    make_changes(session, appointment, 2, admin.user)
    session.add(
        AppointmentChange(
            appointment_id=appointment.id,
            kind="cancelled",
            previous_start=at(1, 10),
            changed_by_id=None,
            created_at=clock.local_now() + timedelta(minutes=1),
        )
    )
    session.flush()
    rows = auth_client(admin.user).get(url(center)).json()
    changes = next(r for r in rows if r["id"] == appointment.id)["changes"]
    assert [c["note"] for c in changes] == ["", "n1", "n0"]
    assert changes[0]["changed_by"] is None
    assert changes[1]["changed_by"] == {"full_name": admin.user.full_name}
    assert changes[1]["kind"] == "rescheduled"
    assert changes[1]["new_start"] == at(3, 10).strftime(FORMAT)
    assert changes[0]["new_start"] is None
    assert all(re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}", c["created_at"]) for c in changes)
    assert set(changes[1]) == {"kind", "previous_start", "new_start", "note", "changed_by", "created_at"}


def test_list_query_count_does_not_grow_with_changes(
    setup, auth_client, appointment_factory, service_factory, session
):
    center, admin, member_a, _, _ = setup
    service = service_factory(center)
    for n in range(3):
        make_changes(session, appointment_factory(member_a, service, at(3 + n, 10)), 2, admin.user)
    for appointment in session.scalars(select(Appointment)).all():
        make_changes(session, appointment, 2, admin.user)
    session.expire_all()
    statements = []

    def count(conn, cursor, statement, parameters, context, executemany):
        statements.append(statement)

    client = auth_client(admin.user)
    event.listen(session.get_bind(), "before_cursor_execute", count)
    try:
        response = client.get(url(center))
    finally:
        event.remove(session.get_bind(), "before_cursor_execute", count)
    assert len(response.json()) == 5
    assert len(statements) <= 8
