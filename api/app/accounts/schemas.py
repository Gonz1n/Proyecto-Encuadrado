import re
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.formats import NotBlank


class CenterSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    name: str


class MembershipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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

    first_name: Annotated[str, Field(max_length=150), NotBlank] | None = None
    last_name: Annotated[str, Field(max_length=150), NotBlank] | None = None
    title: Annotated[str, Field(max_length=120)] | None = None
    university: Annotated[str, Field(max_length=150)] | None = None
    bio: Annotated[str, Field(max_length=500)] | None = None
    health_registry: Annotated[str, Field(max_length=10)] | None = None

    @field_validator("health_registry")
    @classmethod
    def digits_only(cls, value: str | None) -> str | None:
        if value and not re.fullmatch(r"\d+", value):
            raise ValueError("El registro solo admite números")
        return value
