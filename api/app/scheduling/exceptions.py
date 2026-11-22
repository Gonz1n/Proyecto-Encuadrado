from app.core.errors.exceptions import DomainError
from app.scheduling.constants.messages import APPOINTMENT_LOCKED, SLOT_UNAVAILABLE
from app.shared.constants.messages import NOT_FOUND


class SlotUnavailable(DomainError):
    def __init__(self):
        super().__init__(409, SLOT_UNAVAILABLE)


class AppointmentLocked(DomainError):
    def __init__(self):
        super().__init__(400, APPOINTMENT_LOCKED)


class AppointmentNotFound(DomainError):
    def __init__(self):
        super().__init__(404, NOT_FOUND)
