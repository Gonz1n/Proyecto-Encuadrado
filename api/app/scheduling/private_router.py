from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.accounts.deps import CurrentUser
from app.centers.access import NOT_FOUND, CenterDep, ManagerDep
from app.centers.models import Role
from app.core import clock
from app.core.errors.exceptions import DomainError, field_error
from app.db import SessionDep
from app.scheduling import availability, repository, services
from app.scheduling.models import Appointment
from app.scheduling.resolve import resolve_professional, resolve_service
from app.scheduling.schemas import AppointmentOut, CancelIn, DaysOut, RescheduleIn, SlotsOut, StaffBookingIn

router = APIRouter(prefix="/api/centers/{slug}/appointments", tags=["appointments"])


def _appointment(session: SessionDep, access: ManagerDep, appointment_id: int) -> Appointment:
    appointment = repository.get_manageable(session, access, appointment_id)
    if appointment is None:
        raise DomainError(404, NOT_FOUND)
    return appointment


ManagedAppointment = Annotated[Appointment, Depends(_appointment)]


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
    return repository.list_appointments(
        session,
        access.center.id,
        from_day or today,
        to_day or today + timedelta(days=30),
        professional,
        include_cancelled == "true",
    )


@router.post("/", response_model=AppointmentOut, status_code=201)
def create_appointment(session: SessionDep, user: CurrentUser, access: ManagerDep, data: StaffBookingIn) -> Appointment:
    service = resolve_service(session, access.center, data.service)
    professional = resolve_professional(session, access.center, data.professional)
    if access.membership.role == Role.MEMBER and professional.id != access.membership.id:
        raise field_error("professional", "Solo puedes agendar horas para ti")
    availability.ensure_in_window(data.start.date(), False, "start")
    return services.create_appointment(session, access.center, data, professional, service, user)


@router.patch("/{appointment_id}/", response_model=AppointmentOut)
def reschedule(
    session: SessionDep, user: CurrentUser, appointment: ManagedAppointment, data: RescheduleIn
) -> Appointment:
    availability.ensure_in_window(data.start.date(), True, "start")
    return services.reschedule_appointment(session, appointment, data.start, data.note, user, clock.local_now())


@router.post("/{appointment_id}/cancel/", response_model=AppointmentOut)
def cancel(session: SessionDep, user: CurrentUser, appointment: ManagedAppointment, data: CancelIn) -> Appointment:
    return services.cancel_appointment(session, appointment, data.note, user, clock.local_now())


@router.get("/{appointment_id}/availability/", response_model=SlotsOut)
def read_availability(session: SessionDep, appointment: ManagedAppointment, date: Annotated[date, Query()]) -> SlotsOut:
    availability.ensure_in_window(date, True, "date")
    slots = availability.slots_for_day(
        session, appointment.professional, appointment.service, date, clock.local_now(), appointment.id
    )
    return SlotsOut(date=date, slots=[slot.strftime("%H:%M") for slot in slots])


@router.get("/{appointment_id}/availability/days/", response_model=DaysOut)
def read_availability_days(session: SessionDep, appointment: ManagedAppointment) -> DaysOut:
    first, last = availability.booking_window(clock.local_today(), True)
    days = availability.days_with_slots(
        session, appointment.professional, appointment.service, first, last, clock.local_now(), appointment.id
    )
    return DaysOut(days=days)
