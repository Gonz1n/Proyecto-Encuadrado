from fastapi import APIRouter

from app.accounts.api.dependencies import CurrentUser
from app.centers.api.dependencies import AdminDep, CenterDep
from app.centers.schemas.center import CenterOut, CenterUpdate, CenterUpdatedOut
from app.centers.services import center_settings
from app.db.session import SessionDep

router = APIRouter(prefix="/api/centers/{slug}", tags=["centers"])


@router.get("/", response_model=CenterOut)
def read_center(access: CenterDep) -> CenterOut:
    return CenterOut.model_validate(access.center)


@router.patch("/", response_model=CenterUpdatedOut)
def update_center(
    session: SessionDep, access: AdminDep, user: CurrentUser, data: CenterUpdate
) -> CenterUpdatedOut:
    return center_settings.update_center(session, access.center, user, data)
