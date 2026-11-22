from datetime import datetime, timedelta
from functools import cache
from itertools import count

import pytest

from app.accounts.models import User
from app.accounts.security import hash_password
from app.centers.models import Center, CenterClosure, Membership, Role, Service
from app.scheduling.models import Appointment

_hash = cache(hash_password)


@pytest.fixture
def user_factory(session):
    counter = count(1)

    def make(email=None, password="clave-segura-123", **extra) -> User:
        n = next(counter)
        user = User(
            email=email or f"user{n}@example.com",
            password=_hash(password),
            first_name=extra.pop("first_name", "Nombre"),
            last_name=extra.pop("last_name", f"Apellido{n}"),
            **extra,
        )
        session.add(user)
        session.flush()
        return user

    return make


@pytest.fixture
def center_factory(session):
    counter = count(1)

    def make(slug=None, **extra) -> Center:
        n = next(counter)
        extra.setdefault("name", f"Centro {n}")
        center = Center(slug=slug or f"centro-{n}", **extra)
        session.add(center)
        session.flush()
        return center

    return make


@pytest.fixture
def membership_factory(session, user_factory, center_factory):
    def make(role=Role.MEMBER, user=None, center=None) -> Membership:
        membership = Membership(
            user=user or user_factory(),
            center=center or center_factory(),
            role=role,
        )
        session.add(membership)
        session.flush()
        return membership

    return make


@pytest.fixture
def service_factory(session, center_factory):
    counter = count(1)

    def make(center=None, **extra) -> Service:
        n = next(counter)
        extra.setdefault("name", f"Servicio {n}")
        extra.setdefault("price_clp", 20000)
        extra.setdefault("duration_minutes", 30)
        service = Service(center=center or center_factory(), **extra)
        session.add(service)
        session.flush()
        return service

    return make


@pytest.fixture
def appointment_factory(session):
    def make(professional, service, start: datetime, **extra) -> Appointment:
        extra.setdefault("patient_name", "Paciente Prueba")
        extra.setdefault("patient_email", "paciente@example.com")
        extra.setdefault("patient_phone", "+56912345678")
        extra.setdefault("end", start + timedelta(minutes=service.duration_minutes))
        appointment = Appointment(
            center=professional.center,
            professional=professional,
            service=service,
            start=start,
            **extra,
        )
        session.add(appointment)
        session.flush()
        return appointment

    return make


@pytest.fixture
def closure_factory(session):
    def make(center, day, reason="Feriado") -> CenterClosure:
        closure = CenterClosure(center=center, date=day, reason=reason)
        session.add(closure)
        session.flush()
        return closure

    return make


@pytest.fixture
def staff(membership_factory, auth_client):
    def make(role=Role.ADMIN, **center):
        membership = membership_factory(role=role)
        for field, value in center.items():
            setattr(membership.center, field, value)
        return membership, auth_client(membership.user)

    return make
