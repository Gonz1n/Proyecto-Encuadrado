from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app import clock
from app.accounts.deps import CurrentUser
from app.centers.access import CenterDep, ManagerDep
from app.centers.models import Role
from app.db import SessionDep
from app.errors import DomainError
from app.scheduling import availability, repository, services
from app.scheduling.models import Appointment
from app.scheduling.schemas import AppointmentOut, CancelIn, DaysOut, RescheduleIn, SlotsOut

router = APIRouter(prefix="/api/centers/{slug}/appointments", tags=["appointments"])

NOT_FOUND = "No encontrado."
SLOT_TAKEN = "La hora seleccionada ya no está disponible"
LOCKED = "No se puede modificar una cita pasada"


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
) -> list[AppointmentOut]:
    today = clock.local_today()
    if access.membership.role == Role.MEMBER:
        professional = access.membership.id
    rows = repository.list_appointments(
        session,
        access.center.id,
        from_day or today,
        to_day or today + timedelta(days=30),
        professional,
        include_cancelled == "true",
    )
    return [AppointmentOut.from_appointment(row) for row in rows]


@router.patch("/{appointment_id}/", response_model=AppointmentOut)
def reschedule(
    session: SessionDep, user: CurrentUser, appointment: ManagedAppointment, data: RescheduleIn
) -> AppointmentOut:
    availability.ensure_in_window(data.start.date(), True, "start")
    try:
        updated = services.reschedule_appointment(
            session, appointment, data.start, data.note, user, clock.local_now()
        )
    except services.AppointmentNotFound:
        raise DomainError(404, NOT_FOUND) from None
    except services.AppointmentLocked:
        raise DomainError(400, LOCKED) from None
    except services.SlotUnavailable:
        raise DomainError(409, SLOT_TAKEN) from None
    return AppointmentOut.from_appointment(updated)


@router.post("/{appointment_id}/cancel/", response_model=AppointmentOut)
def cancel(session: SessionDep, user: CurrentUser, appointment: ManagedAppointment, data: CancelIn) -> AppointmentOut:
    try:
        updated = services.cancel_appointment(session, appointment, data.note, user, clock.local_now())
    except services.AppointmentNotFound:
        raise DomainError(404, NOT_FOUND) from None
    except services.AppointmentLocked:
        raise DomainError(400, LOCKED) from None
    return AppointmentOut.from_appointment(updated)


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
