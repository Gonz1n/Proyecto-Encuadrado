from datetime import datetime
from zoneinfo import ZoneInfo

import pytest
from fastapi import APIRouter
from pydantic import BaseModel, ValidationError

from app.core import clock
from app.core.errors.exceptions import DomainError
from app.formats import HourMinute, Minute
from app.main import app


class Probe(BaseModel):
    name: str


class MinuteProbe(BaseModel):
    start: Minute


router = APIRouter()


@router.post("/api/_minute/")
def minute(body: MinuteProbe):
    return {}


@router.post("/api/_probe/")
def probe(body: Probe):
    return {"name": body.name}


@router.get("/api/_domain/")
def domain():
    raise DomainError(409, "Conflicto.")


@pytest.fixture(autouse=True)
def probe_routes():
    app.include_router(router)
    yield
    app.router.routes[:] = [r for r in app.router.routes if getattr(r, "path", "") not in ("/api/_probe/", "/api/_domain/", "/api/_minute/")]


def test_local_now_is_santiago_time():
    expected = datetime.now(ZoneInfo("America/Santiago")).replace(tzinfo=None)
    assert abs((clock.local_now() - expected).total_seconds()) < 5
    assert clock.local_now().tzinfo is None
    assert clock.local_now().microsecond == 0
    assert clock.local_today() == clock.local_now().date()


def test_minute_format_round_trip():
    assert MinuteProbe(start="2026-12-01T10:30").model_dump(mode="json") == {"start": "2026-12-01T10:30"}
    for bad in ["2026-12-01T10:30:00", "2026-12-01T10:30Z", "2026-12-01"]:
        with pytest.raises(ValidationError):
            MinuteProbe(start=bad)


def test_hour_minute_format_round_trip():
    class H(BaseModel):
        at: HourMinute

    assert H(at="09:05").model_dump(mode="json") == {"at": "09:05"}
    with pytest.raises(ValidationError):
        H(at="09:05:00")


def test_validation_error_is_400_field_dict(client):
    r = client.post("/api/_probe/", json={})
    assert r.status_code == 400
    assert r.json() == {"name": ["Este campo es obligatorio."]}


def test_domain_error_shape(client):
    r = client.get("/api/_domain/")
    assert r.status_code == 409
    assert r.json() == {"detail": "Conflicto."}


def test_invalid_minute_returns_spanish_message(client):
    r = client.post("/api/_minute/", json={"start": "2026-12-01"})
    assert r.status_code == 400
    assert r.json() == {"start": ["Formato de fecha y hora inválido. Usa AAAA-MM-DDTHH:MM."]}
