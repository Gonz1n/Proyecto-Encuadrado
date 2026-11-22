from datetime import date, datetime, time
from enum import StrEnum

from sqlalchemy import BigInteger, CheckConstraint, Date, DateTime, ForeignKey, String, Text, Time, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.accounts.models import User
from app.core import clock
from app.db import Base


class Role(StrEnum):
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


ROLE_LABELS: dict[Role, str] = {
    Role.ADMIN: "Administrador",
    Role.MEMBER: "Profesional",
    Role.VIEWER: "Solo lectura",
}


class Center(Base):
    __tablename__ = "centers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(50), unique=True)
    description: Mapped[str] = mapped_column(String(400), default="")
    opening_time: Mapped[time] = mapped_column(Time, default=time(9, 0))
    closing_time: Mapped[time] = mapped_column(Time, default=time(18, 0))
    terms: Mapped[str] = mapped_column(Text, default="")
    website_url: Mapped[str] = mapped_column(String(200), default="")
    instagram_url: Mapped[str] = mapped_column(String(200), default="")
    facebook_url: Mapped[str] = mapped_column(String(200), default="")
    linkedin_url: Mapped[str] = mapped_column(String(200), default="")
    whatsapp_number: Mapped[str] = mapped_column(String(12), default="")
    address: Mapped[str] = mapped_column(String(200), default="", server_default="")
    commune: Mapped[str] = mapped_column(String(80), default="", server_default="")
    phone: Mapped[str] = mapped_column(String(20), default="", server_default="")
    email: Mapped[str] = mapped_column(String(254), default="", server_default="")
    open_days: Mapped[list[int]] = mapped_column(JSONB, default=lambda: [0, 1, 2, 3, 4, 5, 6])
    lunch_start: Mapped[time | None] = mapped_column(Time)
    lunch_end: Mapped[time | None] = mapped_column(Time)

    memberships: Mapped[list["Membership"]] = relationship(back_populates="center")
    services: Mapped[list["Service"]] = relationship(back_populates="center")


class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("user_id", "center_id", name="unique_user_center"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"))
    center_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("centers.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(10), default=Role.MEMBER)

    user: Mapped[User] = relationship(back_populates="memberships")
    center: Mapped[Center] = relationship(back_populates="memberships")

    @property
    def role_label(self) -> str:
        return ROLE_LABELS[Role(self.role)]

    @property
    def full_name(self) -> str:
        return self.user.full_name


class Service(Base):
    __tablename__ = "services"
    __table_args__ = (
        CheckConstraint("price_clp >= 0", name="service_price_clp_gte_0"),
        CheckConstraint("duration_minutes >= 0", name="service_duration_minutes_gte_0"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    center_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("centers.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(120))
    price_clp: Mapped[int]
    duration_minutes: Mapped[int]
    description: Mapped[str] = mapped_column(String(300), default="", server_default="")
    is_active: Mapped[bool] = mapped_column(default=True)

    center: Mapped[Center] = relationship(back_populates="services")


class CenterClosure(Base):
    __tablename__ = "center_closures"
    __table_args__ = (UniqueConstraint("center_id", "date", name="unique_center_closure_date"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    center_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("centers.id", ondelete="CASCADE"))
    date: Mapped[date] = mapped_column(Date)
    reason: Mapped[str] = mapped_column(String(120))
    created_by_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=clock.local_now)

    center: Mapped[Center] = relationship()
