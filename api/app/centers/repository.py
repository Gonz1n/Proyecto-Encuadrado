from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.accounts.models import User
from app.centers.models import Center, CenterClosure, Membership, Role, Service


def get_center_by_slug(session: Session, slug: str) -> Center | None:
    return session.scalar(select(Center).where(Center.slug == slug))


def get_membership(session: Session, user_id: int, center_id: int) -> Membership | None:
    return session.scalar(
        select(Membership).where(Membership.user_id == user_id, Membership.center_id == center_id)
    )


def bookable_memberships(session: Session, center_id: int) -> list[Membership]:
    return list(
        session.scalars(
            select(Membership)
            .options(joinedload(Membership.user))
            .where(Membership.center_id == center_id, Membership.role != Role.VIEWER)
            .order_by(Membership.id)
        )
    )


def active_services(session: Session, center_id: int) -> list[Service]:
    return list(
        session.scalars(
            select(Service).where(Service.center_id == center_id, Service.is_active).order_by(Service.name)
        )
    )


def get_active_service(session: Session, center_id: int, service_id: int) -> Service | None:
    return session.scalar(
        select(Service).where(Service.id == service_id, Service.center_id == center_id, Service.is_active)
    )


def members(session: Session, center_id: int) -> list[Membership]:
    return list(
        session.scalars(
            select(Membership)
            .join(Membership.user)
            .options(joinedload(Membership.user))
            .where(Membership.center_id == center_id)
            .order_by(Membership.role, User.last_name, User.first_name)
        )
    )


def closure_dates(session: Session, center_id: int, start: date, end: date) -> set[date]:
    return set(
        session.scalars(
            select(CenterClosure.date).where(
                CenterClosure.center_id == center_id, CenterClosure.date >= start, CenterClosure.date <= end
            )
        )
    )


def upcoming_closures(session: Session, center_id: int, today: date) -> list[CenterClosure]:
    return list(
        session.scalars(
            select(CenterClosure)
            .where(CenterClosure.center_id == center_id, CenterClosure.date >= today)
            .order_by(CenterClosure.date)
        )
    )


def get_closure(session: Session, center_id: int, closure_id: int) -> CenterClosure | None:
    return session.scalar(
        select(CenterClosure).where(CenterClosure.id == closure_id, CenterClosure.center_id == center_id)
    )


def closure_exists(session: Session, center_id: int, day: date) -> bool:
    return day in closure_dates(session, center_id, day, day)
