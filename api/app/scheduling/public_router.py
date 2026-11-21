from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import clock
from app.centers import repository as centers
from app.centers.models import Center, Membership, Service
from app.centers.schemas import CenterListItemOut, CenterOut, ServiceOut
from app.db import SessionDep
from app.errors import DomainError, field_error
from app.scheduling import availability, services
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

SLOT_TAKEN = "La hora seleccionada ya no está disponible"


def _center(session: SessionDep, slug: str) -> Center:
    center = centers.get_center_by_slug(session, slug)
    if center is None:
        raise DomainError(404, "No encontrado.")
    return center


PublicCenter = Annotated[Center, Depends(_center)]


@list_router.get("/", response_model=list[CenterListItemOut])
def list_centers(session: SessionDep) -> list[CenterListItemOut]:
    return [CenterListItemOut.model_validate(c) for c in centers.all_centers(session)]


BIGINT_MAX = 2**63 - 1


def _to_id(value, field: str, invalid: str) -> int | None:
    if isinstance(value, bool) or not isinstance(value, (int, str)) or not str(value).strip().isascii():
        raise field_error(field, invalid)
    try:
        number = int(value)
    except ValueError:
        raise field_error(field, invalid) from None
    return number if -BIGINT_MAX <= number <= BIGINT_MAX else None


def _resolve_service(session: Session, center: Center, value) -> Service:
    service_id = _to_id(value, "service", "El servicio no es válido")
    service = None if service_id is None else centers.get_active_service(session, center.id, service_id)
    if service is None:
        raise field_error("service", "El servicio no está disponible")
    return service


def _resolve_professional(session: Session, center: Center, value) -> Membership:
    wanted = _to_id(value, "professional", "El profesional no es válido")
    for membership in centers.bookable_memberships(session, center.id):
        if membership.id == wanted:
            return membership
    raise field_error("professional", "El profesional no está disponible")


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
    service_row = _resolve_service(session, center, service)
    professional_row = _resolve_professional(session, center, professional)
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
    service_row = _resolve_service(session, center, service)
    professional_row = _resolve_professional(session, center, professional)
    first, last = availability.booking_window(clock.local_today())
    days = availability.days_with_slots(session, professional_row, service_row, first, last, clock.local_now())
    return DaysOut(days=days)


@router.post("/appointments/", response_model=BookingOut, status_code=201)
def create_appointment(session: SessionDep, center: PublicCenter, data: PublicBookingIn) -> BookingOut:
    service = _resolve_service(session, center, data.service)
    professional = _resolve_professional(session, center, data.professional)
    availability.ensure_in_window(data.start.date(), False, "start")
    try:
        appointment = services.create_public_appointment(session, center, data, professional, service)
    except services.SlotUnavailable:
        raise DomainError(409, SLOT_TAKEN) from None
    return BookingOut.from_appointment(appointment, center, professional, service)
