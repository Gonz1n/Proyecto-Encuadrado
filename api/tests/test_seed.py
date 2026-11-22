from datetime import timedelta

from sqlalchemy import func, select, update

from app.accounts.repository import get_user_by_email
from app.accounts.security import verify_password
from app.centers.models import Center, Membership, Service
from app.core import clock
from app.db.seed.loaders import run as run_seed
from app.scheduling.models import Appointment


def count(session, model):
    return session.scalar(select(func.count()).select_from(model))


def test_seed_is_idempotent_and_covers_every_role(session):
    run_seed(session)
    first_count = count(session, Appointment)
    run_seed(session)
    assert count(session, Center) == 2
    for center in session.scalars(select(Center)):
        roles = set(session.scalars(select(Membership.role).where(Membership.center_id == center.id)))
        assert roles == {"admin", "member", "viewer"}
        appointments = count_for(session, center)
        assert 8 <= appointments <= 12
    valentina = get_user_by_email(session, "valentina@aurora.cl")
    assert len(valentina.memberships) == 2
    camila = get_user_by_email(session, "camila@aurora.cl")
    assert verify_password("encuadrado2026", camila.password)
    assert count(session, Appointment) == first_count


def count_for(session, center):
    return session.scalar(
        select(func.count()).select_from(Appointment).where(Appointment.center_id == center.id)
    )


def test_seed_replenishes_future_appointments_when_only_past_remain(session):
    run_seed(session)
    delta = timedelta(days=60)
    session.execute(update(Appointment).values(start=Appointment.start - delta, end=Appointment.end - delta))
    run_seed(session)
    now = clock.local_now()
    for center in session.scalars(select(Center)):
        future = session.scalar(
            select(func.count())
            .select_from(Appointment)
            .where(Appointment.center_id == center.id, Appointment.start >= now)
        )
        assert future > 0


def test_seed_does_not_overwrite_existing_rows(session):
    run_seed(session)
    center = session.scalar(select(Center).where(Center.slug == "centro-aurora"))
    center.description = "Editada"
    get_user_by_email(session, "camila@aurora.cl").title = "Directora"
    service = session.scalar(select(Service).where(Service.center_id == center.id))
    service.is_active = False
    session.flush()
    before = (count(session, Center), count(session, Service), count(session, Appointment))
    run_seed(session)
    assert session.scalar(select(Center.description).where(Center.id == center.id)) == "Editada"
    assert get_user_by_email(session, "camila@aurora.cl").title == "Directora"
    assert session.scalar(select(Service.is_active).where(Service.id == service.id)) is False
    assert (count(session, Center), count(session, Service), count(session, Appointment)) == before
