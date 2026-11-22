from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query

from app.centers.api.dependencies import PublicCenter
from app.core import clock
from app.db.session import SessionDep
from app.scheduling import availability, services
from app.scheduling.models import Appointment
from app.scheduling.resolve import resolve_professional, resolve_service
from app.scheduling.schemas import (
    BookingOut,
    DaysOut,
    PublicBookingIn,
    SlotsOut,
)

router = APIRouter(prefix="/api/public/centers/{slug}", tags=["public"])


@router.get("/availability/", response_model=SlotsOut)
def read_availability(
    session: SessionDep,
    center: PublicCenter,
    service: Annotated[str, Query()],
    professional: Annotated[str, Query()],
    date: Annotated[date, Query()],
) -> SlotsOut:
    service_row = resolve_service(session, center, service)
    professional_row = resolve_professional(session, center, professional)
    availability.ensure_in_window(date, False, "date")
    slots = availability.slots_for_day(session, professional_row, service_row, date, clock.local_now())
    return SlotsOut(date=date, slots=[slot.strftime("%H:%M") for slot in slots])


@router.get("/availability/days/", response_model=DaysOut)
def read_availability_days(
    session: SessionDep,
    center: PublicCenter,
    service: Annotated[str, Query()],
    professional: Annotated[str, Query()],
) -> DaysOut:
    service_row = resolve_service(session, center, service)
    professional_row = resolve_professional(session, center, professional)
    first, last = availability.booking_window(clock.local_today())
    days = availability.days_with_slots(session, professional_row, service_row, first, last, clock.local_now())
    return DaysOut(days=days)


@router.post("/appointments/", response_model=BookingOut, status_code=201)
def create_appointment(session: SessionDep, center: PublicCenter, data: PublicBookingIn) -> Appointment:
    service = resolve_service(session, center, data.service)
    professional = resolve_professional(session, center, data.professional)
    availability.ensure_in_window(data.start.date(), False, "start")
    return services.create_appointment(session, center, data, professional, service)
