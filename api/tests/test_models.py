from datetime import datetime, timedelta

import pytest
from sqlalchemy.exc import IntegrityError

from app.core import clock
from app.scheduling.constants.statuses import ChangeKind
from app.scheduling.models.appointment_change import AppointmentChange


def test_user_cannot_have_two_memberships_in_same_center(session, user_factory, center_factory, membership_factory):
    user = user_factory()
    center = center_factory()
    membership_factory(user=user, center=center)
    with pytest.raises(IntegrityError):
        membership_factory(user=user, center=center)


def test_appointment_changes_are_newest_first(session, membership_factory, service_factory, appointment_factory):
    professional = membership_factory()
    service = service_factory(center=professional.center)
    start = datetime(2026, 12, 1, 10, 0)
    appt = appointment_factory(professional, service, start)
    base = clock.local_now()
    for note, offset in (("primero", 0), ("segundo", 1)):
        session.add(
            AppointmentChange(
                appointment=appt,
                kind=ChangeKind.RESCHEDULED,
                previous_start=start,
                new_start=start + timedelta(days=1),
                note=note,
                created_at=base + timedelta(seconds=offset),
            )
        )
    session.flush()
    session.expire(appt)
    assert [c.note for c in appt.changes] == ["segundo", "primero"]
