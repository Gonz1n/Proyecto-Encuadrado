from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.centers.models import Membership
from app.scheduling.models import Appointment, AppointmentStatus


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
