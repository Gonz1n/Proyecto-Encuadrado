from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.accounts.models import ApiToken, User
from app.accounts.security import hash_password, new_token_key
from app.centers.models import Center, Membership


def normalize_email(email: str) -> str:
    local, _, domain = email.rpartition("@")
    return f"{local}@{domain.lower()}"


def create_user(session: Session, email: str, password: str | None = None, **extra) -> User:
    if not email:
        raise ValueError("El correo es obligatorio")
    user = User(
        email=normalize_email(email),
        password=hash_password(password) if password else "",
        **extra,
    )
    session.add(user)
    session.flush()
    return user


def get_user_by_email(session: Session, email: str) -> User | None:
    return session.scalar(select(User).where(User.email == normalize_email(email)))


def get_or_create_token(session: Session, user: User) -> ApiToken:
    token = session.scalar(select(ApiToken).where(ApiToken.user_id == user.id))
    if token is None:
        token = ApiToken(key=new_token_key(), user_id=user.id)
        session.add(token)
        session.flush()
    return token


def user_for_token(session: Session, key: str) -> User | None:
    return session.scalar(
        select(User).join(ApiToken, ApiToken.user_id == User.id).where(ApiToken.key == key, User.is_active)
    )


def delete_token(session: Session, key: str) -> None:
    token = session.get(ApiToken, key)
    if token is not None:
        session.delete(token)
        session.flush()


def list_memberships(session: Session, user: User) -> list[Membership]:
    return list(
        session.scalars(
            select(Membership)
            .join(Center)
            .options(joinedload(Membership.center))
            .where(Membership.user_id == user.id)
            .order_by(Center.name, Membership.id)
        )
    )
