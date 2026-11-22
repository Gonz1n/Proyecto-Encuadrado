from fastapi import APIRouter, Response

from app.centers.api.dependencies import AdminDep, CenterDep
from app.centers.models.service import Service
from app.centers.repositories import services
from app.centers.schemas.service import ServiceIn, ServiceOut, ServiceUpdate
from app.centers.services import service_catalog
from app.db.session import SessionDep

router = APIRouter(prefix="/api/centers/{slug}/services", tags=["centers"])


@router.get("/", response_model=list[ServiceOut])
def list_services(session: SessionDep, access: CenterDep) -> list[Service]:
    return services.active_services(session, access.center.id)


@router.post("/", response_model=ServiceOut, status_code=201)
def create_service(session: SessionDep, access: AdminDep, data: ServiceIn) -> Service:
    return service_catalog.create_service(session, access.center, data)


@router.patch("/{service_id}/", response_model=ServiceOut)
def update_service(session: SessionDep, access: AdminDep, service_id: int, data: ServiceUpdate) -> Service:
    return service_catalog.update_service(session, access.center, service_id, data)


@router.delete("/{service_id}/", status_code=204)
def delete_service(session: SessionDep, access: AdminDep, service_id: int) -> Response:
    service_catalog.deactivate_service(session, access.center, service_id)
    return Response(status_code=204)
