from collections import defaultdict
from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session

from app import clock
from app.centers.models import Membership, Service
from app.errors import field_error
from app.scheduling import repository

SLOT_STEP_MINUTES = 30
WINDOW_DAYS = 30
OUT_OF_WINDOW = "La fecha está fuera del período de reserva"


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


def booking_window(today: date, include_today: bool = False) -> tuple[date, date]:
    start = today if include_today else today + timedelta(days=1)
    return start, today + timedelta(days=WINDOW_DAYS)


def ensure_in_window(day: date, include_today: bool, field: str) -> None:
    start, end = booking_window(clock.local_today(), include_today)
    if not start <= day <= end:
        raise field_error(field, OUT_OF_WINDOW)


def slots_for_day(
    session: Session,
    professional: Membership,
    service: Service,
    day: date,
    now: datetime,
    exclude_id: int | None = None,
) -> list[datetime]:
    center = professional.center
    if day.weekday() not in center.open_days:
        return []
    return free_slots(
        day,
        center.opening_time,
        center.closing_time,
        service.duration_minutes,
        repository.busy_ranges(session, professional, day, day, exclude_id),
        not_before=now,
    )


def days_with_slots(
    session: Session,
    professional: Membership,
    service: Service,
    start: date,
    end: date,
    now: datetime,
    exclude_id: int | None = None,
) -> list[date]:
    center = professional.center
    busy_by_day = defaultdict(list)
    for b_start, b_end in repository.busy_ranges(session, professional, start, end, exclude_id):
        busy_by_day[b_start.date()].append((b_start, b_end))
        if b_end.date() != b_start.date():
            busy_by_day[b_end.date()].append((b_start, b_end))
    days = (start + timedelta(days=n) for n in range((end - start).days + 1))
    return [
        day
        for day in days
        if day.weekday() in center.open_days
        and free_slots(
            day,
            center.opening_time,
            center.closing_time,
            service.duration_minutes,
            busy_by_day[day],
            not_before=now,
        )
    ]
