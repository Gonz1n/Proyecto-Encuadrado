from app.core.errors.exceptions import DomainError
from app.scheduling.constants.messages import APPOINTMENT_LOCKED, SLOT_UNAVAILABLE
from app.shared.constants.messages import NOT_FOUND


class SlotUnavailable(DomainError):
    # La hora ya fue tomada
    def __init__(self):
        super().__init__(409, SLOT_UNAVAILABLE)


class AppointmentLocked(DomainError):
    # La cita ya paso y no se puede cambiar
    def __init__(self):
        super().__init__(400, APPOINTMENT_LOCKED)


class AppointmentNotFound(DomainError):
    # La cita no existe o ya fue cancelada
    def __init__(self):
        super().__init__(404, NOT_FOUND)
