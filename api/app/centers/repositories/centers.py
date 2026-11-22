from sqlalchemy import select
from sqlalchemy.orm import Session

from app.centers.models.center import Center


# Busca un centro por su slug
def get_center_by_slug(session: Session, slug: str) -> Center | None:
    return session.scalar(select(Center).where(Center.slug == slug))


# Lista los centros ordenados por nombre
def all_centers(session: Session) -> list[Center]:
    return session.scalars(select(Center).order_by(Center.name)).all()
