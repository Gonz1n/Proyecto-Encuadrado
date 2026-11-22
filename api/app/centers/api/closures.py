from fastapi import APIRouter, Response

from app.accounts.api.dependencies import CurrentUser
from app.centers.api.dependencies import AdminDep, CenterDep
from app.centers.models.closure import CenterClosure
from app.centers.repositories import closures
from app.centers.schemas.closure import ClosureCreatedOut, ClosureIn, ClosureOut
from app.centers.services import closures as closure_service
from app.core import clock
from app.db.session import SessionDep

router = APIRouter(prefix="/api/centers/{slug}/closures", tags=["centers"])


# Lista los cierres desde hoy en adelante
@router.get("/", response_model=list[ClosureOut])
def list_closures(session: SessionDep, access: CenterDep) -> list[CenterClosure]:
    return closures.upcoming_closures(session, access.center.id, clock.local_today())


# Marca un dia como cerrado
@router.post("/", response_model=ClosureCreatedOut, status_code=201)
def create_closure(session: SessionDep, access: AdminDep, user: CurrentUser, data: ClosureIn) -> ClosureCreatedOut:
    return closure_service.create_closure(session, access.center, user, data)


# Quita un dia cerrado
@router.delete("/{closure_id}/", status_code=204)
def delete_closure(session: SessionDep, access: AdminDep, closure_id: int) -> Response:
    closure_service.delete_closure(session, access.center, closure_id)
    return Response(status_code=204)
