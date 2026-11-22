from enum import StrEnum


class AppointmentStatus(StrEnum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class Modality(StrEnum):
    IN_PERSON = "in_person"
    REMOTE = "remote"


class ChangeKind(StrEnum):
    RESCHEDULED = "rescheduled"
    CANCELLED = "cancelled"
