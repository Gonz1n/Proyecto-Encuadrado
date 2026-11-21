from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.centers.models import Center, Membership, Role


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
