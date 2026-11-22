import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.accounts.models.api_token import ApiToken
from app.accounts.models.user import User


# Devuelve el token del usuario o crea uno nuevo
def get_or_create_token(session: Session, user: User) -> ApiToken:
    token = session.scalar(select(ApiToken).where(ApiToken.user_id == user.id))
    if token is None:
        token = ApiToken(key=secrets.token_hex(20), user_id=user.id)
        session.add(token)
        session.flush()
    return token


# Busca el usuario activo de un token
def user_for_token(session: Session, key: str) -> User | None:
    return session.scalar(
        select(User).join(ApiToken, ApiToken.user_id == User.id).where(ApiToken.key == key, User.is_active)
    )


# Borra el token si existe
def delete_token(session: Session, key: str) -> None:
    token = session.get(ApiToken, key)
    if token is not None:
        session.delete(token)
        session.flush()
