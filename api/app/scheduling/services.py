from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import clock
from app.accounts.models import User
from app.centers import repository as centers_repository
from app.centers.access import NOT_FOUND
from app.centers.models import Center, Membership, Service
from app.errors import DomainError
from app.scheduling.availability import slots_for_day
from app.scheduling.models import Appointment, AppointmentChange, AppointmentStatus, ChangeKind
from app.scheduling.schemas import PatientIn


class SlotUnavailable(DomainError):
    def __init__(self):
        super().__init__(409, "La hora seleccionada ya no está disponible")


class AppointmentLocked(DomainError):
    def __init__(self):
        super().__init__(400, "No se puede modificar una cita pasada")


class AppointmentNotFound(DomainError):
    def __init__(self):
        super().__init__(404, NOT_FOUND)


def lock_professional(session: Session, professional: Membership) -> None:
    session.execute(select(User.id).where(User.id == professional.user_id).with_for_update())


def lock_center_professionals(session: Session, center: Center) -> None:
    user_ids = [m.user_id for m in centers_repository.bookable_memberships(session, center.id)]
    session.execute(select(User.id).where(User.id.in_(user_ids)).order_by(User.id).with_for_update())


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


def create_appointment(
    session: Session,
    center: Center,
    data: PatientIn,
    professional: Membership,
    service: Service,
    created_by: User | None = None,
) -> Appointment:
    lock_professional(session, professional)
    now = clock.local_now()
    if data.start not in slots_for_day(session, professional, service, data.start.date(), now):
        session.rollback()
        raise SlotUnavailable
    appointment = Appointment(
        center_id=center.id,
        professional_id=professional.id,
        service_id=service.id,
        start=data.start,
        end=data.start + timedelta(minutes=service.duration_minutes),
        patient_name=data.patient_name,
        patient_email=data.patient_email,
        patient_phone=data.patient_phone,
        patient_rut=data.patient_rut,
        patient_birth_date=data.patient_birth_date,
        modality=data.modality,
        created_by_id=created_by.id if created_by else None,
        terms_accepted_at=None if created_by else now,
        data_consent_at=None if created_by else now,
    )
    session.add(appointment)
    session.commit()
    return appointment


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
