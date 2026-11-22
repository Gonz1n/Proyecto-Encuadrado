from pydantic import BaseModel

from app.centers.models.membership import Membership
from app.centers.schemas.center import CenterOut
from app.centers.schemas.service import ServiceOut


class PublicProfessionalOut(BaseModel):
    id: int
    full_name: str
    title: str
    university: str
    bio: str
    health_registry: str

    @classmethod
    def from_membership(cls, membership: Membership) -> "PublicProfessionalOut":
        user = membership.user
        return cls(
            id=membership.id,
            full_name=user.full_name,
            title=user.title,
            university=user.university,
            bio=user.bio,
            health_registry=user.health_registry,
        )


class PublicCenterOut(CenterOut):
    professionals: list[PublicProfessionalOut]
    services: list[ServiceOut]
