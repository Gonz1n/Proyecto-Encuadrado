from sqlalchemy import select
from sqlalchemy.orm import Session

from app.accounts.models.user import User
from app.centers.models.center import Center
from app.centers.models.membership import Membership
from app.centers.repositories import memberships


def lock_professional(session: Session, professional: Membership) -> None:
    session.execute(select(User.id).where(User.id == professional.user_id).with_for_update())


def lock_center_professionals(session: Session, center: Center) -> None:
    user_ids = [m.user_id for m in memberships.bookable_memberships(session, center.id)]
    session.execute(select(User.id).where(User.id.in_(user_ids)).order_by(User.id).with_for_update())
