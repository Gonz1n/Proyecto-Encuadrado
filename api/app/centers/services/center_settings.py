from datetime import time

from sqlalchemy.orm import Session

from app.accounts.models.user import User
from app.centers.constants.messages import (
    CLOSING_ERROR,
    LUNCH_NOTE,
    LUNCH_ORDER_ERROR,
    LUNCH_PAIR_ERROR,
    LUNCH_RANGE_ERROR,
)
from app.centers.models.center import Center
from app.centers.schemas.center import CenterOut, CenterUpdate, CenterUpdatedOut
from app.core import clock
from app.core.errors.exceptions import field_error
from app.scheduling.repositories import appointments as scheduling_repository
from app.scheduling.services.changes import cancel_for_center
from app.scheduling.services.locks import lock_center_professionals


# Revisa que la colacion este completa y dentro del horario
def _validate_lunch(lunch_start: time | None, lunch_end: time | None, opening: time, closing: time) -> None:
    if lunch_start is None and lunch_end is None:
        return
    if lunch_start is None or lunch_end is None:
        raise field_error("lunch_end", LUNCH_PAIR_ERROR)
    if lunch_end <= lunch_start:
        raise field_error("lunch_end", LUNCH_ORDER_ERROR)
    if lunch_start < opening or lunch_end > closing:
        raise field_error("lunch_end", LUNCH_RANGE_ERROR)


# Guarda el centro y cancela citas que choquen con la colacion
def update_center(session: Session, center: Center, user: User, data: CenterUpdate) -> CenterUpdatedOut:
    changes = data.model_dump(exclude_unset=True)
    opening = changes.get("opening_time", center.opening_time)
    closing = changes.get("closing_time", center.closing_time)
    if closing <= opening:
        raise field_error("closing_time", CLOSING_ERROR)
    lunch = (changes.get("lunch_start", center.lunch_start), changes.get("lunch_end", center.lunch_end))
    _validate_lunch(*lunch, opening, closing)
    lunch_changed = lunch != (center.lunch_start, center.lunch_end)
    cancelled = 0
    if lunch_changed and lunch[0] is not None:
        lock_center_professionals(session, center)
        appointments = scheduling_repository.confirmed_future_overlapping_lunch(
            session, center.id, *lunch, clock.local_now()
        )
        cancelled = cancel_for_center(session, center, appointments, LUNCH_NOTE, user)
    for field, value in changes.items():
        setattr(center, field, value)
    session.commit()
    return CenterUpdatedOut(**CenterOut.model_validate(center).model_dump(), cancelled_appointments=cancelled)
