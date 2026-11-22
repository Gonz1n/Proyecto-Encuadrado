from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.shared.schemas.fields import NotBlank


class ServiceIn(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    name: Annotated[str, Field(max_length=120), NotBlank]
    price_clp: Annotated[int, Field(ge=1, le=10_000_000)]
    duration_minutes: Annotated[int, Field(ge=15, le=240)]
    description: Annotated[str, Field(max_length=300)] = ""

    # Exige una duracion multiplo de 15 minutos
    @field_validator("duration_minutes")
    @classmethod
    def multiple_of_15(cls, value: int) -> int:
        if value % 15:
            raise ValueError("La duración debe ser múltiplo de 15 minutos")
        return value


class ServiceUpdate(ServiceIn):
    name: Annotated[str, Field(max_length=120), NotBlank] = Field(default=None)
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
