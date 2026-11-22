from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.accounts.models.user import User
from app.core import clock
from app.db.base import Base
from app.scheduling.models.appointment import Appointment


class AppointmentChange(Base):
    __tablename__ = "appointment_changes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    appointment_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("appointments.id", ondelete="CASCADE"))
    kind: Mapped[str] = mapped_column(String(12))
    previous_start: Mapped[datetime] = mapped_column(DateTime)
    new_start: Mapped[datetime | None] = mapped_column(DateTime)
    note: Mapped[str] = mapped_column(String(300), default="")
    changed_by_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=clock.local_now)

    appointment: Mapped[Appointment] = relationship(back_populates="changes")
    changed_by: Mapped[User | None] = relationship()
