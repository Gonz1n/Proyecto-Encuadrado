from typing import Annotated

from fastapi import Depends

from app.centers.api.dependencies import ManagerDep
from app.core.errors.exceptions import DomainError
from app.db.session import SessionDep
from app.scheduling.models.appointment import Appointment
from app.scheduling.repositories import appointments
from app.shared.constants.messages import NOT_FOUND


# Busca una cita que el usuario pueda gestionar
def managed_appointment(session: SessionDep, access: ManagerDep, appointment_id: int) -> Appointment:
    appointment = appointments.get_manageable(session, access.membership, appointment_id)
    if appointment is None:
        raise DomainError(404, NOT_FOUND)
    return appointment


ManagedAppointment = Annotated[Appointment, Depends(managed_appointment)]
