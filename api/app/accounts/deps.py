from typing import Annotated

from fastapi import Depends, Header, HTTPException

from app.accounts import repository
from app.accounts.models import User
from app.db.session import SessionDep

_HEADERS = {"WWW-Authenticate": "Bearer"}


def current_token(authorization: Annotated[str | None, Header()] = None) -> str:
    scheme, _, key = (authorization or "").partition(" ")
    if scheme != "Bearer" or not key.strip():
        raise HTTPException(401, "Las credenciales de autenticación no se proveyeron.", headers=_HEADERS)
    return key.strip()


def current_user(session: SessionDep, key: Annotated[str, Depends(current_token)]) -> User:
    user = repository.user_for_token(session, key)
    if user is None:
        raise HTTPException(401, "Token inválido.", headers=_HEADERS)
    return user


CurrentUser = Annotated[User, Depends(current_user)]
CurrentToken = Annotated[str, Depends(current_token)]
