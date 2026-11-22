from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends

from app.accounts.api.dependencies import CurrentUser
from app.centers.constants.roles import Role
from app.centers.models.center import Center
from app.centers.models.membership import Membership
from app.centers.repositories import centers, memberships
from app.core.errors.exceptions import DomainError
from app.db.session import SessionDep
from app.shared.constants.messages import FORBIDDEN, NOT_FOUND


@dataclass
class CenterAccess:
    center: Center
    membership: Membership


def center_access(slug: str, user: CurrentUser, session: SessionDep) -> CenterAccess:
    center = centers.get_center_by_slug(session, slug)
    if center is None:
        raise DomainError(404, NOT_FOUND)
    membership = memberships.get_membership(session, user.id, center.id)
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


def public_center(session: SessionDep, slug: str) -> Center:
    center = centers.get_center_by_slug(session, slug)
    if center is None:
        raise DomainError(404, NOT_FOUND)
    return center


PublicCenter = Annotated[Center, Depends(public_center)]
