from sqlalchemy import select
from sqlalchemy.orm import Session

from app.centers.models.service import Service


# Servicios activos del centro
def active_services(session: Session, center_id: int) -> list[Service]:
    return session.scalars(
        select(Service).where(Service.center_id == center_id, Service.is_active).order_by(Service.name)
    ).all()


# Busca un servicio activo del centro
def get_active_service(session: Session, center_id: int, service_id: int) -> Service | None:
    return session.scalar(
        select(Service).where(Service.id == service_id, Service.center_id == center_id, Service.is_active)
    )
