from datetime import date

from pydantic import BaseModel


class SlotsOut(BaseModel):
    date: date
    slots: list[str]


class DaysOut(BaseModel):
    days: list[date]
