from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.accounts.models.user import User
from app.centers.models.center import Center
from app.core import clock
from app.scheduling.constants.statuses import AppointmentStatus, ChangeKind
from app.scheduling.exceptions import AppointmentLocked, AppointmentNotFound, SlotUnavailable
from app.scheduling.models.appointment import Appointment
from app.scheduling.models.appointment_change import AppointmentChange
from app.scheduling.services.availability import slots_for_day
from app.scheduling.services.locks import lock_center_professionals, lock_professional


def _cancel(session: Session, appointment: Appointment, note: str, user: User) -> None:
    session.add(
        AppointmentChange(
            appointment_id=appointment.id,
            kind=ChangeKind.CANCELLED,
            previous_start=appointment.start,
            note=note,
            changed_by_id=user.id,
        )
    )
    appointment.status = AppointmentStatus.CANCELLED


def cancel_for_center(
    session: Session, center: Center, appointments: list[Appointment], note: str, user: User
) -> int:
    lock_center_professionals(session, center)
    now = clock.local_now()
    ids = [a.id for a in appointments]
    locked = session.scalars(
        select(Appointment)
        .where(
            Appointment.id.in_(ids),
            Appointment.status == AppointmentStatus.CONFIRMED,
            Appointment.start > now,
        )
        .with_for_update()
        .execution_options(populate_existing=True)
    ).all()
    for appointment in locked:
        _cancel(session, appointment, note, user)
    return len(locked)


def _lock_editable(session: Session, appointment: Appointment, now: datetime) -> Appointment:
    lock_professional(session, appointment.professional)
    locked = session.scalar(
        select(Appointment)
        .where(Appointment.id == appointment.id, Appointment.status == AppointmentStatus.CONFIRMED)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if locked is None:
        raise AppointmentNotFound
    if locked.start <= now:
        raise AppointmentLocked
    return locked


def reschedule_appointment(
    session: Session, appointment: Appointment, start: datetime, note: str, user: User, now: datetime
) -> Appointment:
    appointment = _lock_editable(session, appointment, now)
    if start == appointment.start:
        return appointment
    slots = slots_for_day(session, appointment.professional, appointment.service, start.date(), now, appointment.id)
    if start not in slots:
        raise SlotUnavailable
    session.add(
        AppointmentChange(
            appointment_id=appointment.id,
            kind=ChangeKind.RESCHEDULED,
            previous_start=appointment.start,
            new_start=start,
            note=note,
            changed_by_id=user.id,
        )
    )
    appointment.start = start
    appointment.end = start + timedelta(minutes=appointment.service.duration_minutes)
    session.commit()
    return appointment


def cancel_appointment(session: Session, appointment: Appointment, note: str, user: User, now: datetime) -> Appointment:
    appointment = _lock_editable(session, appointment, now)
    _cancel(session, appointment, note, user)
    session.commit()
    return appointment
