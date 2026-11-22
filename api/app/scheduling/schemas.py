from datetime import date
from typing import Annotated, Any, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field, ValidationError, field_validator

from app.centers.schemas.center import CenterOut
from app.centers.schemas.service import ServiceOut
from app.core import clock
from app.shared.schemas.fields import Minute
from app.shared.validators.phone import valid_phone
from app.shared.validators.rut import normalize_rut


class PublicProfessionalOut(BaseModel):
    id: int
    full_name: str
    title: str
    university: str
    bio: str
    health_registry: str

    @classmethod
    def from_membership(cls, membership) -> "PublicProfessionalOut":
        user = membership.user
        return cls(
            id=membership.id,
            full_name=user.full_name,
            title=user.title,
            university=user.university,
            bio=user.bio,
            health_registry=user.health_registry,
        )


class PublicCenterOut(CenterOut):
    professionals: list[PublicProfessionalOut]
    services: list[ServiceOut]


class SlotsOut(BaseModel):
    date: date
    slots: list[str]


class DaysOut(BaseModel):
    days: list[date]


class PatientIn(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    service: Any
    professional: Any
    start: Minute
    patient_name: Annotated[str, Field(min_length=3, max_length=120)]
    patient_email: EmailStr
    patient_phone: Annotated[str, AfterValidator(valid_phone)]
    patient_rut: str
    patient_birth_date: date
    modality: Literal["in_person", "remote"] = "in_person"

    @field_validator("patient_email", mode="wrap")
    @classmethod
    def valid_email(cls, value, handler) -> str:
        try:
            return handler(value)
        except ValidationError:
            raise ValueError("Ingresa un correo electrónico válido.") from None

    @field_validator("patient_rut")
    @classmethod
    def valid_rut(cls, value: str) -> str:
        rut = normalize_rut(value)
        if not rut:
            raise ValueError("Ingresa un RUT válido")
        return rut

    @field_validator("patient_birth_date")
    @classmethod
    def valid_birth_date(cls, value: date) -> date:
        today = clock.local_today()
        if value > today:
            raise ValueError("La fecha de nacimiento no puede ser futura")
        if value.year < today.year - 120:
            raise ValueError("Revisa la fecha de nacimiento")
        return value


class PublicBookingIn(PatientIn):
    accept_terms: bool = Field(default=False, validate_default=True)
    data_consent: bool = Field(default=False, validate_default=True)

    @field_validator("accept_terms")
    @classmethod
    def terms_accepted(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Debes aceptar los términos y condiciones")
        return value

    @field_validator("data_consent")
    @classmethod
    def consent_given(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Debes autorizar el tratamiento de tus datos personales")
        return value


class StaffBookingIn(PatientIn):
    pass


class BookingCenterOut(BaseModel):
    slug: str
    name: str


class BookingProfessionalOut(BaseModel):
    full_name: str


class BookingServiceOut(BaseModel):
    id: int
    name: str
    price_clp: int


class BookingOut(BaseModel):
    id: int
    center: BookingCenterOut
    professional: BookingProfessionalOut
    service: BookingServiceOut
    start: Minute
    end: Minute
    modality: str


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
