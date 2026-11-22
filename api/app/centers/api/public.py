from fastapi import APIRouter

from app.centers.api.dependencies import PublicCenter
from app.centers.models.center import Center
from app.centers.repositories import centers
from app.centers.schemas.center import CenterListItemOut
from app.centers.schemas.public import PublicCenterOut
from app.centers.services.public_center import build_public_center
from app.db.session import SessionDep

router = APIRouter(prefix="/api/public/centers", tags=["public"])


# Lista todos los centros
@router.get("/", response_model=list[CenterListItemOut])
def list_centers(session: SessionDep) -> list[Center]:
    return centers.all_centers(session)


# Devuelve el perfil publico del centro
@router.get("/{slug}/", response_model=PublicCenterOut)
def read_center(session: SessionDep, center: PublicCenter) -> PublicCenterOut:
    return build_public_center(session, center)
