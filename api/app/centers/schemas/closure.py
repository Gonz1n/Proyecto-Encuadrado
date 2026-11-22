from datetime import date
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class ClosureIn(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    date: date
    reason: Annotated[str, Field(min_length=1, max_length=120)]


class ClosureOut(BaseModel):
    id: int
    date: date
    reason: str


class ClosureCreatedOut(ClosureOut):
    cancelled_appointments: int
