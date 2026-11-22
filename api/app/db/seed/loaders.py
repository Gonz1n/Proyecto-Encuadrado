import datetime
import random
from functools import cache

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.accounts.models.user import User
from app.accounts.repositories.users import create_user, get_user_by_email
from app.accounts.security.passwords import hash_password
from app.centers.constants.roles import Role
from app.centers.models.center import Center
from app.centers.models.membership import Membership
from app.centers.models.service import Service
from app.centers.repositories import centers, memberships, services
from app.core import clock
from app.db.seed.data import CENTERS, PASSWORD, PATIENTS, USERS
from app.scheduling.availability import slots_for_day
from app.scheduling.models import Appointment, AppointmentStatus, Modality
from app.shared.validators.rut import format_rut


@cache
def demo_password_hash() -> str:
    return hash_password(PASSWORD)


def get_or_create_user(session: Session, email: str, first_name: str, last_name: str, title: str) -> User:
    user = get_user_by_email(session, email)
    if user is None:
        user = create_user(session, email, first_name=first_name, last_name=last_name, title=title)
        user.password = demo_password_hash()
    return user


def get_or_create_center(session: Session, spec: dict) -> Center:
    center = centers.get_center_by_slug(session, spec["slug"])
    if center is None:
        fields = {key: spec[key] for key in ("name", "description", "opening_time", "closing_time", "terms")}
        center = Center(slug=spec["slug"], **fields, **spec["contact"])
        session.add(center)
        session.flush()
    return center


def ensure_membership(session: Session, user: User, center: Center, role: Role) -> None:
    if memberships.get_membership(session, user.id, center.id) is None:
        session.add(Membership(user_id=user.id, center_id=center.id, role=role))


def ensure_service(session: Session, center: Center, name: str, price: int, duration: int, description: str) -> None:
    exists = session.scalar(select(Service.id).where(Service.center_id == center.id, Service.name == name))
    if exists is None:
        session.add(Service(center_id=center.id, name=name, price_clp=price, duration_minutes=duration, description=description))


def has_future_appointments(session: Session, center: Center, now: datetime.datetime) -> bool:
    return session.scalar(
        select(Appointment.id)
        .where(
            Appointment.center_id == center.id,
            Appointment.status == AppointmentStatus.CONFIRMED,
            Appointment.start >= now,
        )
        .limit(1)
    ) is not None


def create_appointments(session: Session, center: Center, now: datetime.datetime) -> int:
    rng = random.Random(2026)
    professionals = memberships.bookable_memberships(session, center.id)
    center_services = services.active_services(session, center.id)
    target = rng.randint(8, 12)
    created = 0
    for _ in range(target * 5):
        if created == target:
            break
        professional = rng.choice(professionals)
        service = rng.choice(center_services)
        day = (now + datetime.timedelta(days=rng.randint(1, 14))).date()
        slots = slots_for_day(session, professional, service, day, now)
        if not slots:
            continue
        start = rng.choice(slots)
        name, email = PATIENTS[created % len(PATIENTS)]
        session.add(
            Appointment(
                center_id=center.id,
                professional_id=professional.id,
                service_id=service.id,
                start=start,
                end=start + datetime.timedelta(minutes=service.duration_minutes),
                patient_name=name,
                patient_email=email,
                patient_phone=f"+569{rng.randint(10000000, 99999999)}",
                modality=rng.choice(list(Modality)),
                patient_rut=format_rut(rng.randint(8_000_000, 25_000_000)),
                patient_birth_date=datetime.date(rng.randint(1960, 2005), rng.randint(1, 12), rng.randint(1, 28)),
                terms_accepted_at=now,
                data_consent_at=now,
            )
        )
        session.flush()
        created += 1
    return created


def run(session: Session) -> dict[str, int]:
    now = clock.local_now()
    users = {email: get_or_create_user(session, email, *data) for email, data in USERS.items()}
    created = 0
    for spec in CENTERS:
        center = get_or_create_center(session, spec)
        for email, role in spec["members"]:
            ensure_membership(session, users[email], center, role)
        for name, price, duration, description in spec["services"]:
            ensure_service(session, center, name, price, duration, description)
        session.flush()
        if not has_future_appointments(session, center, now):
            created += create_appointments(session, center, now)
    session.commit()
    return {
        "users": session.scalar(select(func.count()).select_from(User)),
        "centers": session.scalar(select(func.count()).select_from(Center)),
        "services": session.scalar(select(func.count()).select_from(Service)),
        "appointments": created,
    }
