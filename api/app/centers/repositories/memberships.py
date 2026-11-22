from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.accounts.models.user import User
from app.centers.constants.roles import Role
from app.centers.models.center import Center
from app.centers.models.membership import Membership


# Busca la membresia de un usuario en un centro
def get_membership(session: Session, user_id: int, center_id: int) -> Membership | None:
    return session.scalar(
        select(Membership).where(Membership.user_id == user_id, Membership.center_id == center_id)
    )


# Profesionales que pueden recibir citas
def bookable_memberships(session: Session, center_id: int) -> list[Membership]:
    return session.scalars(
        select(Membership)
        .options(joinedload(Membership.user))
        .where(Membership.center_id == center_id, Membership.role != Role.VIEWER)
        .order_by(Membership.id)
    ).all()


# Todos los miembros del centro con su usuario
def members(session: Session, center_id: int) -> list[Membership]:
    return session.scalars(
        select(Membership)
        .join(Membership.user)
        .options(joinedload(Membership.user))
        .where(Membership.center_id == center_id)
        .order_by(Membership.role, User.last_name, User.first_name)
    ).all()


# Membresias del usuario con su centro
def user_memberships(session: Session, user: User) -> list[Membership]:
    return session.scalars(
        select(Membership)
        .join(Center)
        .options(joinedload(Membership.center))
        .where(Membership.user_id == user.id)
        .order_by(Center.name, Membership.id)
    ).all()
