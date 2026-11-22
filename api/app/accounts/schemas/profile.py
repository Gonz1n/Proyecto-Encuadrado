import re
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.shared.schemas.fields import NotBlank


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
