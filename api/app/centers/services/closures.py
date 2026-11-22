from sqlalchemy.orm import Session

from app.accounts.models.user import User
from app.centers.constants.messages import DUPLICATE_CLOSURE_ERROR, PAST_DATE_ERROR
from app.centers.models.center import Center
from app.centers.models.closure import CenterClosure
from app.centers.repositories import closures
from app.centers.schemas.closure import ClosureCreatedOut, ClosureIn
from app.core import clock
from app.core.errors.exceptions import DomainError, field_error
from app.scheduling import repository as scheduling_repository
from app.scheduling.services import cancel_for_center, lock_center_professionals
from app.shared.constants.messages import NOT_FOUND


def create_closure(session: Session, center: Center, user: User, data: ClosureIn) -> ClosureCreatedOut:
    if data.date < clock.local_today():
        raise field_error("date", PAST_DATE_ERROR)
    if closures.closure_exists(session, center.id, data.date):
        raise field_error("date", DUPLICATE_CLOSURE_ERROR)
    lock_center_professionals(session, center)
    closure = CenterClosure(center_id=center.id, date=data.date, reason=data.reason, created_by_id=user.id)
    session.add(closure)
    appointments = scheduling_repository.confirmed_future_on_day(session, center.id, data.date, clock.local_now())
    cancelled = cancel_for_center(session, center, appointments, f"Centro cerrado: {data.reason}", user)
    session.commit()
    return ClosureCreatedOut(id=closure.id, date=closure.date, reason=closure.reason, cancelled_appointments=cancelled)


def delete_closure(session: Session, center: Center, closure_id: int) -> None:
    closure = closures.get_closure(session, center.id, closure_id)
    if closure is None:
        raise DomainError(404, NOT_FOUND)
    session.delete(closure)
    session.commit()
