from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Index, String, desc
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.accounts.models.user import User
from app.centers.models import Center, Membership, Service
from app.core import clock
from app.db.base import Base


class AppointmentStatus(StrEnum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class Modality(StrEnum):
    IN_PERSON = "in_person"
    REMOTE = "remote"


class ChangeKind(StrEnum):
    RESCHEDULED = "rescheduled"
    CANCELLED = "cancelled"


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (Index("ix_appointments_professional_start", "professional_id", "start"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    center_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("centers.id", ondelete="CASCADE"))
    professional_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("memberships.id", ondelete="CASCADE"))
    service_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("services.id", ondelete="RESTRICT"))
    start: Mapped[datetime] = mapped_column(DateTime)
    end: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(10), default=AppointmentStatus.CONFIRMED)
    patient_name: Mapped[str] = mapped_column(String(120))
    patient_email: Mapped[str] = mapped_column(String(254))
    patient_phone: Mapped[str] = mapped_column(String(20))
    patient_rut: Mapped[str] = mapped_column(String(12), default="")
    patient_birth_date: Mapped[date | None] = mapped_column(Date)
    modality: Mapped[str] = mapped_column(String(10), default=Modality.IN_PERSON)
    terms_accepted_at: Mapped[datetime | None] = mapped_column(DateTime)
    data_consent_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_by_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=clock.local_now)

    center: Mapped[Center] = relationship()
    professional: Mapped[Membership] = relationship()
    service: Mapped[Service] = relationship()
    changes: Mapped[list["AppointmentChange"]] = relationship(
        back_populates="appointment",
        order_by=lambda: (desc(AppointmentChange.created_at), desc(AppointmentChange.id)),
    )


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
