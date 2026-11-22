from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends

from app.accounts.deps import CurrentUser
from app.centers import repository
from app.centers.models import Center, Membership, Role
from app.core.errors.exceptions import DomainError
from app.db.session import SessionDep

NOT_FOUND = "No encontrado."
FORBIDDEN = "No tienes permiso para realizar esta acción."


@dataclass
class CenterAccess:
    center: Center
    membership: Membership


def center_access(slug: str, user: CurrentUser, session: SessionDep) -> CenterAccess:
    center = repository.get_center_by_slug(session, slug)
    if center is None:
        raise DomainError(404, NOT_FOUND)
    membership = repository.get_membership(session, user.id, center.id)
    if membership is None:
        raise DomainError(404, NOT_FOUND)
    return CenterAccess(center, membership)


CenterDep = Annotated[CenterAccess, Depends(center_access)]


def admin_access(access: CenterDep) -> CenterAccess:
    if access.membership.role != Role.ADMIN:
        raise DomainError(403, FORBIDDEN)
    return access


def manager_access(access: CenterDep) -> CenterAccess:
    if access.membership.role == Role.VIEWER:
        raise DomainError(403, FORBIDDEN)
    return access


AdminDep = Annotated[CenterAccess, Depends(admin_access)]
ManagerDep = Annotated[CenterAccess, Depends(manager_access)]
