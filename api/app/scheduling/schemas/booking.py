from datetime import date
from typing import Annotated, Any, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field, ValidationError, field_validator

from app.core import clock
from app.shared.schemas.fields import Minute
from app.shared.validators.phone import valid_phone
from app.shared.validators.rut import normalize_rut


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

    # Cambia el mensaje de correo invalido
    @field_validator("patient_email", mode="wrap")
    @classmethod
    def valid_email(cls, value, handler) -> str:
        try:
            return handler(value)
        except ValidationError:
            raise ValueError("Ingresa un correo electrónico válido.") from None

    # Valida y formatea el RUT
    @field_validator("patient_rut")
    @classmethod
    def valid_rut(cls, value: str) -> str:
        rut = normalize_rut(value)
        if not rut:
            raise ValueError("Ingresa un RUT válido")
        return rut

    # Revisa que la fecha de nacimiento sea razonable
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

    # Exige aceptar los terminos
    @field_validator("accept_terms")
    @classmethod
    def terms_accepted(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Debes aceptar los términos y condiciones")
        return value

    # Exige autorizar el uso de datos
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
