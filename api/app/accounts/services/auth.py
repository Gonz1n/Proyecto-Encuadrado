from sqlalchemy.orm import Session

from app.accounts.constants.messages import BAD_CREDENTIALS
from app.accounts.repositories import tokens, users
from app.accounts.schemas.auth import LoginIn, LoginOut
from app.accounts.security.passwords import verify_password
from app.accounts.services.users import build_user_out
from app.core.errors.exceptions import DomainError


def login(session: Session, body: object) -> LoginOut:
    try:
        credentials = LoginIn.model_validate(body)
    except ValueError:
        raise DomainError(400, BAD_CREDENTIALS) from None
    user = users.get_user_by_email(session, credentials.email)
    if user is None or not user.is_active or not verify_password(credentials.password, user.password):
        raise DomainError(400, BAD_CREDENTIALS)
    token = tokens.get_or_create_token(session, user)
    session.commit()
    return LoginOut(token=token.key, user=build_user_out(session, user))


def logout(session: Session, key: str) -> None:
    tokens.delete_token(session, key)
    session.commit()
