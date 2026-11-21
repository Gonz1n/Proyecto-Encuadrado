from datetime import date
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, ValidationError, field_validator

from app import clock
from app.centers.phone import PHONE_ERROR, normalize_phone
from app.centers.schemas import CenterOut, ServiceOut
from app.formats import Minute
from app.scheduling.rut import normalize_rut


class PublicProfessionalOut(BaseModel):
    id: int
    full_name: str
    title: str
    avatar_url: str
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
            avatar_url=user.avatar_url,
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


class PublicBookingIn(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    service: Any
    professional: Any
    start: Minute
    patient_name: Annotated[str, Field(min_length=3, max_length=120)]
    patient_email: EmailStr
    patient_phone: str
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

    @field_validator("patient_phone")
    @classmethod
    def valid_phone(cls, value: str) -> str:
        phone = normalize_phone(value)
        if not phone:
            raise ValueError(PHONE_ERROR)
        return phone

    @field_validator("patient_birth_date")
    @classmethod
    def valid_birth_date(cls, value: date) -> date:
        today = clock.local_today()
        if value > today:
            raise ValueError("La fecha de nacimiento no puede ser futura")
        if value.year < today.year - 120:
            raise ValueError("Revisa la fecha de nacimiento")
        return value


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

    @classmethod
    def from_appointment(cls, appointment, center, professional, service) -> "BookingOut":
        return cls(
            id=appointment.id,
            center=BookingCenterOut(slug=center.slug, name=center.name),
            professional=BookingProfessionalOut(full_name=professional.user.full_name),
            service=BookingServiceOut(id=service.id, name=service.name, price_clp=service.price_clp),
            start=appointment.start,
            end=appointment.end,
            modality=appointment.modality,
        )
