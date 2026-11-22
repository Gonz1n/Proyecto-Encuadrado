from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request

from app.accounts.constants.headers import AUTH_HEADERS
from app.accounts.constants.messages import INVALID_TOKEN, MISSING_CREDENTIALS
from app.accounts.models.user import User
from app.accounts.repositories import tokens
from app.db.session import SessionDep


def current_token(authorization: Annotated[str | None, Header()] = None) -> str:
    scheme, _, key = (authorization or "").partition(" ")
    if scheme != "Bearer" or not key.strip():
        raise HTTPException(401, MISSING_CREDENTIALS, headers=AUTH_HEADERS)
    return key.strip()


def current_user(session: SessionDep, key: Annotated[str, Depends(current_token)]) -> User:
    user = tokens.user_for_token(session, key)
    if user is None:
        raise HTTPException(401, INVALID_TOKEN, headers=AUTH_HEADERS)
    return user


async def json_body(request: Request) -> object:
    try:
        return await request.json()
    except ValueError:
        return None


CurrentUser = Annotated[User, Depends(current_user)]
CurrentToken = Annotated[str, Depends(current_token)]
JsonBody = Annotated[object, Depends(json_body)]
