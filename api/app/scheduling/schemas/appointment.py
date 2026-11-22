from datetime import date
from typing import Annotated

from pydantic import BaseModel, Field

from app.scheduling.schemas.booking import BookingServiceOut
from app.shared.schemas.fields import Minute


class ChangeAuthorOut(BaseModel):
    full_name: str


class ChangeOut(BaseModel):
    kind: str
    previous_start: Minute
    new_start: Minute | None
    note: str
    changed_by: ChangeAuthorOut | None
    created_at: Minute


class AppointmentProfessionalOut(BaseModel):
    id: int
    full_name: str


class AppointmentOut(BaseModel):
    id: int
    start: Minute
    end: Minute
    status: str
    service: BookingServiceOut
    professional: AppointmentProfessionalOut
    patient_name: str
    patient_email: str
    patient_phone: str
    patient_rut: str
    patient_birth_date: date | None
    modality: str
    changes: list[ChangeOut]


class RescheduleIn(BaseModel):
    start: Minute
    note: Annotated[str, Field(max_length=300)] = ""


class CancelIn(BaseModel):
    note: Annotated[str, Field(max_length=300)] = ""
