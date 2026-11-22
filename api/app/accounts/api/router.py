from fastapi import APIRouter, Response

from app.accounts.api.dependencies import CurrentToken, CurrentUser, JsonBody
from app.accounts.schemas.auth import LoginOut
from app.accounts.schemas.profile import ProfileUpdate
from app.accounts.schemas.user import UserOut
from app.accounts.services import auth, users
from app.db.session import SessionDep

router = APIRouter(prefix="/api/auth", tags=["auth"])


# Inicia sesion y devuelve el token con el usuario
@router.post("/login/", response_model=LoginOut)
def login(body: JsonBody, session: SessionDep) -> LoginOut:
    return auth.login(session, body)


# Cierra la sesion borrando el token
@router.post("/logout/", status_code=204)
def logout(session: SessionDep, _: CurrentUser, key: CurrentToken) -> Response:
    auth.logout(session, key)
    return Response(status_code=204)


# Devuelve el usuario autenticado
@router.get("/me/", response_model=UserOut)
def me(session: SessionDep, user: CurrentUser) -> UserOut:
    return users.build_user_out(session, user)


# Actualiza el perfil del usuario autenticado
@router.patch("/me/", response_model=UserOut)
def update_me(session: SessionDep, user: CurrentUser, data: ProfileUpdate) -> UserOut:
    return users.update_profile(session, user, data)
