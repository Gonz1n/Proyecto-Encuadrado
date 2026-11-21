import re
from datetime import date
from typing import Annotated
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, TypeAdapter, field_validator

from app.centers.models import ROLE_LABELS, Role
from app.centers.phone import PHONE_ERROR, normalize_phone
from app.formats import HourMinute

_url = TypeAdapter(HttpUrl)
_email = TypeAdapter(EmailStr)
CONTACT_PHONE = re.compile(r"^\+?[0-9][0-9 -]{6,18}$")
CONTACT_PHONE_ERROR = "Ingresa un teléfono válido, por ejemplo +56 2 2345 6789"
CONTACT_EMAIL_ERROR = "Ingresa un correo válido"

SOCIAL_NETWORKS = {
    "instagram_url": ("instagram.com", "Instagram"),
    "facebook_url": ("facebook.com", "Facebook"),
    "linkedin_url": ("linkedin.com", "LinkedIn"),
}


class CenterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    slug: str
    description: str
    opening_time: HourMinute
    closing_time: HourMinute
    lunch_start: HourMinute | None
    lunch_end: HourMinute | None
    terms: str
    website_url: str
    instagram_url: str
    facebook_url: str
    linkedin_url: str
    whatsapp_number: str
    address: str
    commune: str
    phone: str
    email: str
    open_days: list[int]


class CenterListItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    name: str
    description: str


class CenterUpdatedOut(CenterOut):
    cancelled_appointments: int


class CenterUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    name: Annotated[str, Field(max_length=120)] = Field(default=None)
    description: Annotated[str, Field(max_length=400)] = Field(default=None)
    opening_time: HourMinute = Field(default=None)
    closing_time: HourMinute = Field(default=None)
    lunch_start: HourMinute | None = Field(default=None)
    lunch_end: HourMinute | None = Field(default=None)
    terms: Annotated[str, Field(max_length=5000)] = Field(default=None)
    website_url: Annotated[str, Field(max_length=200)] = Field(default=None)
    instagram_url: Annotated[str, Field(max_length=200)] = Field(default=None)
    facebook_url: Annotated[str, Field(max_length=200)] = Field(default=None)
    linkedin_url: Annotated[str, Field(max_length=200)] = Field(default=None)
    whatsapp_number: Annotated[str, Field(max_length=20)] = Field(default=None)
    address: Annotated[str, Field(max_length=200)] = Field(default=None)
    commune: Annotated[str, Field(max_length=80)] = Field(default=None)
    phone: Annotated[str, Field(max_length=20)] = Field(default=None)
    email: Annotated[str, Field(max_length=254)] = Field(default=None)
    open_days: list[Annotated[int, Field(ge=0, le=6)]] = Field(default=None)

    @field_validator("name")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("Este campo no puede estar en blanco.")
        return value

    @field_validator("website_url", "instagram_url", "facebook_url", "linkedin_url")
    @classmethod
    def valid_url(cls, value: str, info) -> str:
        if not value:
            return value
        try:
            _url.validate_python(value)
        except ValueError:
            raise ValueError("Ingresa una URL válida.") from None
        domain, network = SOCIAL_NETWORKS.get(info.field_name, (None, None))
        if domain and (urlparse(value).hostname or "").removeprefix("www.") != domain:
            raise ValueError(f"El enlace debe ser de {network}")
        return value

    @field_validator("whatsapp_number")
    @classmethod
    def valid_phone(cls, value: str) -> str:
        if not value:
            return ""
        phone = normalize_phone(value)
        if not phone:
            raise ValueError(PHONE_ERROR)
        return phone

    @field_validator("phone")
    @classmethod
    def valid_contact_phone(cls, value: str) -> str:
        if value and not (CONTACT_PHONE.match(value) and sum(c.isdigit() for c in value) >= 8):
            raise ValueError(CONTACT_PHONE_ERROR)
        return value

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        if value:
            try:
                _email.validate_python(value)
            except ValueError:
                raise ValueError(CONTACT_EMAIL_ERROR) from None
        return value

    @field_validator("open_days")
    @classmethod
    def sorted_days(cls, value: list[int]) -> list[int]:
        if not value:
            raise ValueError("Selecciona al menos un día de atención")
        return sorted(set(value))


class ServiceIn(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    name: Annotated[str, Field(max_length=120)]
    price_clp: Annotated[int, Field(ge=1, le=10_000_000)]
    duration_minutes: Annotated[int, Field(ge=15, le=240)]
    description: Annotated[str, Field(max_length=300)] = ""

    @field_validator("name")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("Este campo no puede estar en blanco.")
        return value

    @field_validator("duration_minutes")
    @classmethod
    def multiple_of_15(cls, value: int) -> int:
        if value % 15:
            raise ValueError("La duración debe ser múltiplo de 15 minutos")
        return value


class ServiceUpdate(ServiceIn):
    name: Annotated[str, Field(max_length=120)] = Field(default=None)
    price_clp: Annotated[int, Field(ge=1, le=10_000_000)] = Field(default=None)
    duration_minutes: Annotated[int, Field(ge=15, le=240)] = Field(default=None)
    description: Annotated[str, Field(max_length=300)] = Field(default=None)


class ServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price_clp: int
    duration_minutes: int
    description: str


class MemberUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: str
    email: str
    title: str
    avatar_url: str


class MemberOut(BaseModel):
    id: int
    role: str
    role_label: str
    user: MemberUserOut

    @classmethod
    def from_membership(cls, membership) -> "MemberOut":
        return cls(
            id=membership.id,
            role=membership.role,
            role_label=ROLE_LABELS[Role(membership.role)],
            user=MemberUserOut.model_validate(membership.user),
        )


class ClosureIn(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    date: date
    reason: Annotated[str, Field(min_length=1, max_length=120)]


class ClosureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date
    reason: str


class ClosureCreatedOut(ClosureOut):
    cancelled_appointments: int
