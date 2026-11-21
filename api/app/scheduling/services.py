from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import clock
from app.accounts.models import User
from app.centers.models import Center, Membership, Service
from app.scheduling.availability import slots_for_day
from app.scheduling.models import Appointment
from app.scheduling.schemas import PublicBookingIn


class SlotUnavailable(Exception):
    pass


class AppointmentLocked(Exception):
    pass


class AppointmentNotFound(Exception):
    pass


def lock_professional(session: Session, professional: Membership) -> None:
    session.execute(select(User.id).where(User.id == professional.user_id).with_for_update())


def create_public_appointment(
    session: Session, center: Center, data: PublicBookingIn, professional: Membership, service: Service
) -> Appointment:
    lock_professional(session, professional)
    if data.start not in slots_for_day(session, professional, service, data.start.date(), clock.local_now()):
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
    )
    session.add(appointment)
    session.commit()
    return appointment
