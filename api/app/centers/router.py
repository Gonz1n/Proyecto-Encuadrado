from fastapi import APIRouter
from fastapi.exceptions import RequestValidationError

from app.centers.access import AdminDep, CenterDep
from app.centers.schemas import CenterOut, CenterUpdate
from app.db import SessionDep

router = APIRouter(prefix="/api/centers/{slug}", tags=["centers"])

CLOSING_ERROR = "El horario de término debe ser posterior al de inicio"


@router.get("/", response_model=CenterOut)
def read_center(access: CenterDep) -> CenterOut:
    return CenterOut.model_validate(access.center)


@router.patch("/", response_model=CenterOut)
def update_center(session: SessionDep, access: AdminDep, data: CenterUpdate) -> CenterOut:
    center = access.center
    changes = data.model_dump(exclude_unset=True)
    opening = changes.get("opening_time", center.opening_time)
    closing = changes.get("closing_time", center.closing_time)
    if closing <= opening:
        raise RequestValidationError(
            [{"type": "value_error", "loc": ("body", "closing_time"), "msg": CLOSING_ERROR, "input": None}]
        )
    for field, value in changes.items():
        setattr(center, field, value)
    session.commit()
    return CenterOut.model_validate(center)
