from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.centers.models.closure import CenterClosure


def closure_dates(session: Session, center_id: int, start: date, end: date) -> set[date]:
    return set(
        session.scalars(
            select(CenterClosure.date).where(
                CenterClosure.center_id == center_id, CenterClosure.date >= start, CenterClosure.date <= end
            )
        )
    )


def upcoming_closures(session: Session, center_id: int, today: date) -> list[CenterClosure]:
    return session.scalars(
        select(CenterClosure)
        .where(CenterClosure.center_id == center_id, CenterClosure.date >= today)
        .order_by(CenterClosure.date)
    ).all()


def get_closure(session: Session, center_id: int, closure_id: int) -> CenterClosure | None:
    return session.scalar(
        select(CenterClosure).where(CenterClosure.id == closure_id, CenterClosure.center_id == center_id)
    )


def closure_exists(session: Session, center_id: int, day: date) -> bool:
    return day in closure_dates(session, center_id, day, day)
