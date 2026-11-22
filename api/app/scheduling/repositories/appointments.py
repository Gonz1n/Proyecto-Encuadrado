from datetime import date, datetime, time, timedelta

from sqlalchemy import Time, func, literal, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.centers.constants.roles import Role
from app.centers.models.membership import Membership
from app.scheduling.constants.statuses import AppointmentStatus
from app.scheduling.models.appointment import Appointment
from app.scheduling.models.appointment_change import AppointmentChange


def busy_ranges(
    session: Session, professional: Membership, start: date, end: date, exclude_id: int | None = None
) -> list[tuple[datetime, datetime]]:
    query = (
        select(Appointment.start, Appointment.end)
        .join(Membership, Appointment.professional_id == Membership.id)
        .where(
            Membership.user_id == professional.user_id,
            Appointment.status == AppointmentStatus.CONFIRMED,
            Appointment.start < datetime.combine(end + timedelta(days=1), time.min),
            Appointment.end > datetime.combine(start, time.min),
        )
    )
    if exclude_id is not None:
        query = query.where(Appointment.id != exclude_id)
    return [(row.start, row.end) for row in session.execute(query)]


def list_appointments(
    session: Session,
    center_id: int,
    from_day: date,
    to_day: date,
    professional_id: int | None,
    include_cancelled: bool,
) -> list[Appointment]:
    query = (
        select(Appointment)
        .options(
            joinedload(Appointment.service),
            joinedload(Appointment.professional).joinedload(Membership.user),
            selectinload(Appointment.changes).joinedload(AppointmentChange.changed_by),
        )
        .where(
            Appointment.center_id == center_id,
            Appointment.start >= datetime.combine(from_day, time.min),
            Appointment.start < datetime.combine(to_day + timedelta(days=1), time.min),
        )
        .order_by(Appointment.start, Appointment.id)
    )
    if not include_cancelled:
        query = query.where(Appointment.status == AppointmentStatus.CONFIRMED)
    if professional_id is not None:
        query = query.where(Appointment.professional_id == professional_id)
    return session.scalars(query).all()


def get_manageable(session: Session, membership: Membership, appointment_id: int) -> Appointment | None:
    query = (
        select(Appointment)
        .options(joinedload(Appointment.service), joinedload(Appointment.professional).joinedload(Membership.user))
        .where(
            Appointment.id == appointment_id,
            Appointment.center_id == membership.center_id,
            Appointment.status == AppointmentStatus.CONFIRMED,
        )
    )
    if membership.role == Role.MEMBER:
        query = query.where(Appointment.professional_id == membership.id)
    return session.scalar(query)


def confirmed_future_on_day(session: Session, center_id: int, day: date, now: datetime) -> list[Appointment]:
    return session.scalars(
        select(Appointment).where(
            Appointment.center_id == center_id,
            Appointment.status == AppointmentStatus.CONFIRMED,
            Appointment.start > now,
            Appointment.start >= datetime.combine(day, time.min),
            Appointment.start < datetime.combine(day + timedelta(days=1), time.min),
        )
    ).all()


def confirmed_future_overlapping_lunch(
    session: Session, center_id: int, lunch_start: time, lunch_end: time, now: datetime
) -> list[Appointment]:
    midnight = func.date_trunc("day", Appointment.start)
    return session.scalars(
        select(Appointment).where(
            Appointment.center_id == center_id,
            Appointment.status == AppointmentStatus.CONFIRMED,
            Appointment.start > now,
            Appointment.start < midnight.op("+")(literal(lunch_end, Time)),
            midnight.op("+")(literal(lunch_start, Time)) < Appointment.end,
        )
    ).all()
