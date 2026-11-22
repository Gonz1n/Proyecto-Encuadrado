from datetime import time

from sqlalchemy import BigInteger, String, Text, Time
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


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
