from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query

from app.centers.api.dependencies import PublicCenter
from app.core import clock
from app.db.session import SessionDep
from app.scheduling.models.appointment import Appointment
from app.scheduling.schemas.availability import DaysOut, SlotsOut
from app.scheduling.schemas.booking import BookingOut, PublicBookingIn
from app.scheduling.services import availability, booking
from app.scheduling.services.resolvers import resolve_professional, resolve_service
from app.scheduling.services.slots import booking_window
from app.shared.constants.formats import HOUR_MINUTE_FORMAT

router = APIRouter(prefix="/api/public/centers/{slug}", tags=["public"])


# Horas libres de un dia
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
    return SlotsOut(date=date, slots=[slot.strftime(HOUR_MINUTE_FORMAT) for slot in slots])


# Dias con horas libres
@router.get("/availability/days/", response_model=DaysOut)
def read_availability_days(
    session: SessionDep,
    center: PublicCenter,
    service: Annotated[str, Query()],
    professional: Annotated[str, Query()],
) -> DaysOut:
    service_row = resolve_service(session, center, service)
    professional_row = resolve_professional(session, center, professional)
    first, last = booking_window(clock.local_today())
    days = availability.days_with_slots(session, professional_row, service_row, first, last, clock.local_now())
    return DaysOut(days=days)


# Agenda una cita desde la pagina publica
@router.post("/appointments/", response_model=BookingOut, status_code=201)
def create_appointment(session: SessionDep, center: PublicCenter, data: PublicBookingIn) -> Appointment:
    service = resolve_service(session, center, data.service)
    professional = resolve_professional(session, center, data.professional)
    availability.ensure_in_window(data.start.date(), False, "start")
    return booking.create_appointment(session, center, data, professional, service)
