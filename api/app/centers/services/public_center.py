from sqlalchemy.orm import Session

from app.centers.models.center import Center
from app.centers.repositories import memberships, services
from app.centers.schemas.center import CenterOut
from app.centers.schemas.public import PublicCenterOut, PublicProfessionalOut


def build_public_center(session: Session, center: Center) -> PublicCenterOut:
    professionals = sorted(
        memberships.bookable_memberships(session, center.id),
        key=lambda m: (m.user.last_name, m.user.first_name),
    )
    return PublicCenterOut(
        **CenterOut.model_validate(center).model_dump(),
        professionals=[PublicProfessionalOut.from_membership(m) for m in professionals],
        services=services.active_services(session, center.id),
    )
