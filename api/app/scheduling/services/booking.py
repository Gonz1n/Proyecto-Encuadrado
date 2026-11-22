from datetime import timedelta

from sqlalchemy.orm import Session

from app.accounts.models.user import User
from app.centers.models.center import Center
from app.centers.models.membership import Membership
from app.centers.models.service import Service
from app.core import clock
from app.scheduling.exceptions import SlotUnavailable
from app.scheduling.models.appointment import Appointment
from app.scheduling.schemas.booking import PatientIn
from app.scheduling.services.availability import slots_for_day
from app.scheduling.services.locks import lock_professional


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
