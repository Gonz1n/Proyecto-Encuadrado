import re
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, TypeAdapter, field_validator

_url = TypeAdapter(HttpUrl)


class CenterSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    name: str


class MembershipOut(BaseModel):
    id: int
    role: str
    role_label: str
    center: CenterSummary


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    first_name: str
    last_name: str
    full_name: str
    title: str
    avatar_url: str
    university: str
    bio: str
    health_registry: str
    memberships: list[MembershipOut]


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class LoginOut(BaseModel):
    token: str
    user: UserOut


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    first_name: Annotated[str, Field(max_length=150)] | None = None
    last_name: Annotated[str, Field(max_length=150)] | None = None
    title: Annotated[str, Field(max_length=120)] | None = None
    university: Annotated[str, Field(max_length=150)] | None = None
    bio: Annotated[str, Field(max_length=500)] | None = None
    health_registry: Annotated[str, Field(max_length=10)] | None = None
    avatar_url: Annotated[str, Field(max_length=200)] | None = None

    @field_validator("first_name", "last_name")
    @classmethod
    def not_blank(cls, value: str | None) -> str | None:
        if value is not None and not value:
            raise ValueError("Este campo no puede estar en blanco.")
        return value

    @field_validator("health_registry")
    @classmethod
    def digits_only(cls, value: str | None) -> str | None:
        if value and not re.fullmatch(r"\d+", value):
            raise ValueError("El registro solo admite números")
        return value

    @field_validator("avatar_url")
    @classmethod
    def valid_url(cls, value: str | None) -> str | None:
        if value:
            try:
                _url.validate_python(value)
            except ValueError:
                raise ValueError("Ingresa una URL válida.") from None
        return value
