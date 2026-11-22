from fastapi import APIRouter, Response

from app import clock
from app.accounts.deps import CurrentUser
from app.centers import repository
from app.centers.access import NOT_FOUND, AdminDep, CenterDep
from app.centers.models import CenterClosure, Membership, Service
from app.centers.schemas import (
    CenterOut,
    CenterUpdate,
    CenterUpdatedOut,
    ClosureCreatedOut,
    ClosureIn,
    ClosureOut,
    MemberOut,
    ServiceIn,
    ServiceOut,
    ServiceUpdate,
)
from app.scheduling import repository as scheduling_repository
from app.scheduling.services import cancel_for_center, lock_center_professionals
from app.db import SessionDep
from app.errors import DomainError, field_error

router = APIRouter(prefix="/api/centers/{slug}", tags=["centers"])

CLOSING_ERROR = "El horario de término debe ser posterior al de inicio"
LUNCH_PAIR_ERROR = "Indica inicio y término de la colación"
LUNCH_ORDER_ERROR = "El término de la colación debe ser posterior al inicio"
LUNCH_RANGE_ERROR = "La colación debe estar dentro del horario de atención"
LUNCH_NOTE = "Cancelada por colación del centro"
PAST_DATE_ERROR = "La fecha no puede ser pasada"
DUPLICATE_CLOSURE_ERROR = "Ese día ya está marcado como cerrado"


@router.get("/", response_model=CenterOut)
def read_center(access: CenterDep) -> CenterOut:
    return CenterOut.model_validate(access.center)


def _validate_lunch(lunch_start, lunch_end, opening, closing) -> None:
    if lunch_start is None and lunch_end is None:
        return
    if lunch_start is None or lunch_end is None:
        raise field_error("lunch_end", LUNCH_PAIR_ERROR)
    if lunch_end <= lunch_start:
        raise field_error("lunch_end", LUNCH_ORDER_ERROR)
    if lunch_start < opening or lunch_end > closing:
        raise field_error("lunch_end", LUNCH_RANGE_ERROR)


@router.patch("/", response_model=CenterUpdatedOut)
def update_center(
    session: SessionDep, access: AdminDep, user: CurrentUser, data: CenterUpdate
) -> CenterUpdatedOut:
    center = access.center
    changes = data.model_dump(exclude_unset=True)
    opening = changes.get("opening_time", center.opening_time)
    closing = changes.get("closing_time", center.closing_time)
    if closing <= opening:
        raise field_error("closing_time", CLOSING_ERROR)
    lunch = (changes.get("lunch_start", center.lunch_start), changes.get("lunch_end", center.lunch_end))
    _validate_lunch(*lunch, opening, closing)
    lunch_changed = lunch != (center.lunch_start, center.lunch_end)
    cancelled = 0
    if lunch_changed and lunch[0] is not None:
        lock_center_professionals(session, center)
        appointments = scheduling_repository.confirmed_future_overlapping_lunch(
            session, center.id, *lunch, clock.local_now()
        )
        cancelled = cancel_for_center(session, center, appointments, LUNCH_NOTE, user)
    for field, value in changes.items():
        setattr(center, field, value)
    session.commit()
    return CenterUpdatedOut(**CenterOut.model_validate(center).model_dump(), cancelled_appointments=cancelled)


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
def list_members(session: SessionDep, access: CenterDep) -> list[Membership]:
    return repository.members(session, access.center.id)


@router.get("/closures/", response_model=list[ClosureOut])
def list_closures(session: SessionDep, access: CenterDep) -> list[CenterClosure]:
    return repository.upcoming_closures(session, access.center.id, clock.local_today())


@router.post("/closures/", response_model=ClosureCreatedOut, status_code=201)
def create_closure(session: SessionDep, access: AdminDep, user: CurrentUser, data: ClosureIn) -> ClosureCreatedOut:
    center = access.center
    if data.date < clock.local_today():
        raise field_error("date", PAST_DATE_ERROR)
    if repository.closure_exists(session, center.id, data.date):
        raise field_error("date", DUPLICATE_CLOSURE_ERROR)
    lock_center_professionals(session, center)
    closure = CenterClosure(center_id=center.id, date=data.date, reason=data.reason, created_by_id=user.id)
    session.add(closure)
    appointments = scheduling_repository.confirmed_future_on_day(session, center.id, data.date, clock.local_now())
    cancelled = cancel_for_center(session, center, appointments, f"Centro cerrado: {data.reason}", user)
    session.commit()
    return ClosureCreatedOut(id=closure.id, date=closure.date, reason=closure.reason, cancelled_appointments=cancelled)


@router.delete("/closures/{closure_id}/", status_code=204)
def delete_closure(session: SessionDep, access: AdminDep, closure_id: int) -> Response:
    closure = repository.get_closure(session, access.center.id, closure_id)
    if closure is None:
        raise DomainError(404, NOT_FOUND)
    session.delete(closure)
    session.commit()
    return Response(status_code=204)
