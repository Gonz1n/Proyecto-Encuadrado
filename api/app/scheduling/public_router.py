from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app import clock
from app.centers import repository as centers
from app.centers.models import Center
from app.centers.schemas import CenterListItemOut, CenterOut, ServiceOut
from app.db import SessionDep
from app.errors import DomainError
from app.scheduling import availability, services
from app.scheduling.resolve import SLOT_TAKEN, resolve_professional, resolve_service
from app.scheduling.schemas import (
    BookingOut,
    DaysOut,
    PublicBookingIn,
    PublicCenterOut,
    PublicProfessionalOut,
    SlotsOut,
)

list_router = APIRouter(prefix="/api/public/centers", tags=["public"])
router = APIRouter(prefix="/api/public/centers/{slug}", tags=["public"])


def _center(session: SessionDep, slug: str) -> Center:
    center = centers.get_center_by_slug(session, slug)
    if center is None:
        raise DomainError(404, "No encontrado.")
    return center


PublicCenter = Annotated[Center, Depends(_center)]


@list_router.get("/", response_model=list[CenterListItemOut])
def list_centers(session: SessionDep) -> list[CenterListItemOut]:
    return [CenterListItemOut.model_validate(c) for c in centers.all_centers(session)]


@router.get("/", response_model=PublicCenterOut)
def read_center(session: SessionDep, center: PublicCenter) -> PublicCenterOut:
    professionals = sorted(
        centers.bookable_memberships(session, center.id),
        key=lambda m: (m.user.last_name, m.user.first_name),
    )
    return PublicCenterOut(
        **CenterOut.model_validate(center).model_dump(),
        professionals=[PublicProfessionalOut.from_membership(m) for m in professionals],
        services=[ServiceOut.model_validate(s) for s in centers.active_services(session, center.id)],
    )


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
def create_appointment(session: SessionDep, center: PublicCenter, data: PublicBookingIn) -> BookingOut:
    service = resolve_service(session, center, data.service)
    professional = resolve_professional(session, center, data.professional)
    availability.ensure_in_window(data.start.date(), False, "start")
    try:
        appointment = services.create_appointment(session, center, data, professional, service)
    except services.SlotUnavailable:
        raise DomainError(409, SLOT_TAKEN) from None
    return BookingOut.from_appointment(appointment, center, professional, service)
