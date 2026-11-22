from collections import defaultdict
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.centers.models.center import Center
from app.centers.models.membership import Membership
from app.centers.models.service import Service
from app.centers.repositories import closures
from app.core import clock
from app.core.errors.exceptions import field_error
from app.scheduling.constants.messages import OUT_OF_WINDOW
from app.scheduling.repositories import appointments
from app.scheduling.services.slots import booking_window, free_slots


def ensure_in_window(day: date, include_today: bool, field: str) -> None:
    start, end = booking_window(clock.local_today(), include_today)
    if not start <= day <= end:
        raise field_error(field, OUT_OF_WINDOW)


def _center_slots(
    center: Center, service: Service, day: date, busy: list[tuple[datetime, datetime]], now: datetime
) -> list[datetime]:
    if center.lunch_start is not None and center.lunch_end is not None:
        busy = [*busy, (datetime.combine(day, center.lunch_start), datetime.combine(day, center.lunch_end))]
    return free_slots(day, center.opening_time, center.closing_time, service.duration_minutes, busy, not_before=now)


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
    if closures.closure_dates(session, center.id, day, day):
        return []
    busy = appointments.busy_ranges(session, professional, day, day, exclude_id)
    return _center_slots(center, service, day, busy, now)


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
    for b_start, b_end in appointments.busy_ranges(session, professional, start, end, exclude_id):
        busy_by_day[b_start.date()].append((b_start, b_end))
        if b_end.date() != b_start.date():
            busy_by_day[b_end.date()].append((b_start, b_end))
    closed = closures.closure_dates(session, center.id, start, end)
    days = (start + timedelta(days=n) for n in range((end - start).days + 1))
    return [
        day
        for day in days
        if day.weekday() in center.open_days
        and day not in closed
        and _center_slots(center, service, day, busy_by_day[day], now)
    ]
