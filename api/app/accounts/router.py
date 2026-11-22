from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.accounts import repository
from app.accounts.deps import CurrentToken, CurrentUser
from app.accounts.models import User
from app.accounts.schemas import LoginIn, LoginOut, ProfileUpdate, UserOut
from app.accounts.security import verify_password
from app.db import SessionDep
from app.errors import DomainError

router = APIRouter(prefix="/api/auth", tags=["auth"])

BAD_CREDENTIALS = "Correo o contraseña incorrectos"


def to_user_out(session: Session, user: User) -> UserOut:
    fields = {name: getattr(user, name) for name in UserOut.model_fields if name != "memberships"}
    return UserOut(**fields, memberships=repository.list_memberships(session, user))


async def json_body(request: Request) -> object:
    try:
        return await request.json()
    except ValueError:
        return None


@router.post("/login/", response_model=LoginOut)
def login(body: Annotated[object, Depends(json_body)], session: SessionDep) -> LoginOut:
    try:
        credentials = LoginIn.model_validate(body)
    except ValueError:
        raise DomainError(400, BAD_CREDENTIALS) from None
    user = repository.get_user_by_email(session, credentials.email)
    if user is None or not user.is_active or not verify_password(credentials.password, user.password):
        raise DomainError(400, BAD_CREDENTIALS)
    token = repository.get_or_create_token(session, user)
    session.commit()
    return LoginOut(token=token.key, user=to_user_out(session, user))


@router.post("/logout/", status_code=204)
def logout(session: SessionDep, _: CurrentUser, key: CurrentToken) -> Response:
    repository.delete_token(session, key)
    session.commit()
    return Response(status_code=204)


@router.get("/me/", response_model=UserOut)
def me(session: SessionDep, user: CurrentUser) -> UserOut:
    return to_user_out(session, user)


@router.patch("/me/", response_model=UserOut)
def update_me(session: SessionDep, user: CurrentUser, data: ProfileUpdate) -> UserOut:
    for field, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(user, field, value)
    session.commit()
    return to_user_out(session, user)
