from sqlalchemy.orm import Session

from app.centers.models.center import Center
from app.centers.models.service import Service
from app.centers.repositories import services
from app.centers.schemas.service import ServiceIn, ServiceUpdate
from app.core.errors.exceptions import DomainError
from app.shared.constants.messages import NOT_FOUND


def _active_service(session: Session, center: Center, service_id: int) -> Service:
    service = services.get_active_service(session, center.id, service_id)
    if service is None:
        raise DomainError(404, NOT_FOUND)
    return service


def create_service(session: Session, center: Center, data: ServiceIn) -> Service:
    service = Service(center_id=center.id, **data.model_dump())
    session.add(service)
    session.commit()
    return service


def update_service(session: Session, center: Center, service_id: int, data: ServiceUpdate) -> Service:
    service = _active_service(session, center, service_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    session.commit()
    return service


def deactivate_service(session: Session, center: Center, service_id: int) -> None:
    _active_service(session, center, service_id).is_active = False
    session.commit()
