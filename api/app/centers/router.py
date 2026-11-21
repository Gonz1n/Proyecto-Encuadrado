from fastapi import APIRouter, Response

from app.centers import repository
from app.centers.access import NOT_FOUND, AdminDep, CenterDep
from app.centers.models import Service
from app.centers.schemas import CenterOut, CenterUpdate, MemberOut, ServiceIn, ServiceOut, ServiceUpdate
from app.db import SessionDep
from app.errors import DomainError, field_error

router = APIRouter(prefix="/api/centers/{slug}", tags=["centers"])

CLOSING_ERROR = "El horario de término debe ser posterior al de inicio"


@router.get("/", response_model=CenterOut)
def read_center(access: CenterDep) -> CenterOut:
    return CenterOut.model_validate(access.center)


@router.patch("/", response_model=CenterOut)
def update_center(session: SessionDep, access: AdminDep, data: CenterUpdate) -> CenterOut:
    center = access.center
    changes = data.model_dump(exclude_unset=True)
    opening = changes.get("opening_time", center.opening_time)
    closing = changes.get("closing_time", center.closing_time)
    if closing <= opening:
        raise field_error("closing_time", CLOSING_ERROR)
    for field, value in changes.items():
        setattr(center, field, value)
    session.commit()
    return CenterOut.model_validate(center)


@router.get("/services/", response_model=list[ServiceOut])
def list_services(session: SessionDep, access: CenterDep) -> list[Service]:
    return repository.active_services(session, access.center.id)


@router.post("/services/", response_model=ServiceOut, status_code=201)
def create_service(session: SessionDep, access: AdminDep, data: ServiceIn) -> Service:
    service = Service(center_id=access.center.id, **data.model_dump())
    session.add(service)
    session.commit()
    return service


def _active_service(session: SessionDep, access: AdminDep, service_id: int) -> Service:
    service = repository.get_active_service(session, access.center.id, service_id)
    if service is None:
        raise DomainError(404, NOT_FOUND)
    return service


@router.patch("/services/{service_id}/", response_model=ServiceOut)
def update_service(session: SessionDep, access: AdminDep, service_id: int, data: ServiceUpdate) -> Service:
    service = _active_service(session, access, service_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    session.commit()
    return service


@router.delete("/services/{service_id}/", status_code=204)
def delete_service(session: SessionDep, access: AdminDep, service_id: int) -> Response:
    _active_service(session, access, service_id).is_active = False
    session.commit()
    return Response(status_code=204)


@router.get("/members/", response_model=list[MemberOut])
def list_members(session: SessionDep, access: CenterDep) -> list[MemberOut]:
    return [MemberOut.from_membership(m) for m in repository.members(session, access.center.id)]
