from datetime import date, datetime, time, timedelta

from app.scheduling.constants.availability import SLOT_STEP_MINUTES, WINDOW_DAYS


# Calcula las horas libres de un dia
def free_slots(
    day: date,
    opening: time,
    closing: time,
    duration: int,
    busy: list[tuple[datetime, datetime]],
    not_before: datetime | None = None,
) -> list[datetime]:
    length = timedelta(minutes=duration)
    step = timedelta(minutes=SLOT_STEP_MINUTES)
    limit = datetime.combine(day, closing)
    candidate = datetime.combine(day, opening)
    slots = []
    while candidate + length <= limit:
        free = not any(b_start < candidate + length and candidate < b_end for b_start, b_end in busy)
        if free and (not_before is None or candidate > not_before):
            slots.append(candidate)
        candidate += step
    return slots


# Primer y ultimo dia en que se puede reservar
def booking_window(today: date, include_today: bool = False) -> tuple[date, date]:
    start = today if include_today else today + timedelta(days=1)
    return start, today + timedelta(days=WINDOW_DAYS)
