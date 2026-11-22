from sqlalchemy.orm import Session

from app.centers.models.center import Center
from app.centers.models.membership import Membership
from app.centers.models.service import Service
from app.centers.repositories import memberships, services
from app.core.errors.exceptions import field_error
from app.scheduling.constants.limits import BIGINT_MAX
from app.scheduling.constants.messages import (
    INVALID_PROFESSIONAL,
    INVALID_SERVICE,
    UNAVAILABLE_PROFESSIONAL,
    UNAVAILABLE_SERVICE,
)


def _to_id(value, field: str, invalid: str) -> int | None:
    if isinstance(value, bool) or not isinstance(value, (int, str)) or not str(value).strip().isascii():
        raise field_error(field, invalid)
    try:
        number = int(value)
    except ValueError:
        raise field_error(field, invalid) from None
    return number if -BIGINT_MAX <= number <= BIGINT_MAX else None


def resolve_service(session: Session, center: Center, value) -> Service:
    service_id = _to_id(value, "service", INVALID_SERVICE)
    service = None if service_id is None else services.get_active_service(session, center.id, service_id)
    if service is None:
        raise field_error("service", UNAVAILABLE_SERVICE)
    return service


def resolve_professional(session: Session, center: Center, value) -> Membership:
    wanted = _to_id(value, "professional", INVALID_PROFESSIONAL)
    for membership in memberships.bookable_memberships(session, center.id):
        if membership.id == wanted:
            return membership
    raise field_error("professional", UNAVAILABLE_PROFESSIONAL)
