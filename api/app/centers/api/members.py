from fastapi import APIRouter

from app.centers.api.dependencies import CenterDep
from app.centers.models.membership import Membership
from app.centers.repositories import memberships
from app.centers.schemas.member import MemberOut
from app.db.session import SessionDep

router = APIRouter(prefix="/api/centers/{slug}/members", tags=["centers"])


# Lista los miembros del centro
@router.get("/", response_model=list[MemberOut])
def list_members(session: SessionDep, access: CenterDep) -> list[Membership]:
    return memberships.members(session, access.center.id)
