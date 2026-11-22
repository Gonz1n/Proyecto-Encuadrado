from sqlalchemy import select
from sqlalchemy.orm import Session

from app.accounts.constants.messages import EMAIL_REQUIRED
from app.accounts.models.user import User
from app.accounts.security.passwords import hash_password


# Pasa a minusculas el dominio del correo
def normalize_email(email: str) -> str:
    local, _, domain = email.rpartition("@")
    return f"{local}@{domain.lower()}"


# Crea un usuario con el correo normalizado
def create_user(session: Session, email: str, password: str | None = None, **extra) -> User:
    if not email:
        raise ValueError(EMAIL_REQUIRED)
    user = User(
        email=normalize_email(email),
        password=hash_password(password) if password else "",
        **extra,
    )
    session.add(user)
    session.flush()
    return user


# Busca un usuario por su correo
def get_user_by_email(session: Session, email: str) -> User | None:
    return session.scalar(select(User).where(User.email == normalize_email(email)))
