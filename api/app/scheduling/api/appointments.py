from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Query

from app.accounts.api.dependencies import CurrentUser
from app.centers.api.dependencies import CenterDep, ManagerDep
from app.centers.constants.roles import Role
from app.core import clock
from app.core.errors.exceptions import field_error
from app.db.session import SessionDep
from app.scheduling.api.dependencies import ManagedAppointment
from app.scheduling.constants.availability import DEFAULT_LIST_DAYS
from app.scheduling.constants.messages import OWN_BOOKINGS_ONLY
from app.scheduling.models.appointment import Appointment
from app.scheduling.repositories import appointments
from app.scheduling.schemas.appointment import AppointmentOut, CancelIn, RescheduleIn
from app.scheduling.schemas.availability import DaysOut, SlotsOut
from app.scheduling.schemas.booking import StaffBookingIn
from app.scheduling.services import availability, booking, changes
from app.scheduling.services.resolvers import resolve_professional, resolve_service
from app.scheduling.services.slots import booking_window
from app.shared.constants.formats import HOUR_MINUTE_FORMAT

router = APIRouter(prefix="/api/centers/{slug}/appointments", tags=["appointments"])


@router.get("/", response_model=list[AppointmentOut])
def list_appointments(
    session: SessionDep,
    access: CenterDep,
    from_day: Annotated[date | None, Query(alias="from")] = None,
    to_day: Annotated[date | None, Query(alias="to")] = None,
    professional: Annotated[int | None, Query()] = None,
    include_cancelled: Annotated[str | None, Query()] = None,
) -> list[Appointment]:
    today = clock.local_today()
    if access.membership.role == Role.MEMBER:
        professional = access.membership.id
    return appointments.list_appointments(
        session,
        access.center.id,
        from_day or today,
        to_day or today + timedelta(days=DEFAULT_LIST_DAYS),
        professional,
        include_cancelled == "true",
    )


@router.post("/", response_model=AppointmentOut, status_code=201)
def create_appointment(session: SessionDep, user: CurrentUser, access: ManagerDep, data: StaffBookingIn) -> Appointment:
    service = resolve_service(session, access.center, data.service)
    professional = resolve_professional(session, access.center, data.professional)
    if access.membership.role == Role.MEMBER and professional.id != access.membership.id:
        raise field_error("professional", OWN_BOOKINGS_ONLY)
    availability.ensure_in_window(data.start.date(), False, "start")
    return booking.create_appointment(session, access.center, data, professional, service, user)


@router.patch("/{appointment_id}/", response_model=AppointmentOut)
def reschedule(
    session: SessionDep, user: CurrentUser, appointment: ManagedAppointment, data: RescheduleIn
) -> Appointment:
    availability.ensure_in_window(data.start.date(), True, "start")
    return changes.reschedule_appointment(session, appointment, data.start, data.note, user, clock.local_now())


@router.post("/{appointment_id}/cancel/", response_model=AppointmentOut)
def cancel(session: SessionDep, user: CurrentUser, appointment: ManagedAppointment, data: CancelIn) -> Appointment:
    return changes.cancel_appointment(session, appointment, data.note, user, clock.local_now())


@router.get("/{appointment_id}/availability/", response_model=SlotsOut)
def read_availability(session: SessionDep, appointment: ManagedAppointment, date: Annotated[date, Query()]) -> SlotsOut:
    availability.ensure_in_window(date, True, "date")
    slots = availability.slots_for_day(
        session, appointment.professional, appointment.service, date, clock.local_now(), appointment.id
    )
    return SlotsOut(date=date, slots=[slot.strftime(HOUR_MINUTE_FORMAT) for slot in slots])


@router.get("/{appointment_id}/availability/days/", response_model=DaysOut)
def read_availability_days(session: SessionDep, appointment: ManagedAppointment) -> DaysOut:
    first, last = booking_window(clock.local_today(), True)
    days = availability.days_with_slots(
        session, appointment.professional, appointment.service, first, last, clock.local_now(), appointment.id
    )
    return DaysOut(days=days)
