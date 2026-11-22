from sqlalchemy import BigInteger, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    password: Mapped[str] = mapped_column(String(128))
    email: Mapped[str] = mapped_column(String(254), unique=True)
    first_name: Mapped[str] = mapped_column(String(150), default="")
    last_name: Mapped[str] = mapped_column(String(150), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    title: Mapped[str] = mapped_column(String(120), default="")
    university: Mapped[str] = mapped_column(String(150), default="")
    bio: Mapped[str] = mapped_column(String(500), default="")
    health_registry: Mapped[str] = mapped_column(String(10), default="")

    memberships: Mapped[list["Membership"]] = relationship(back_populates="user")

    # Nombre y apellido juntos
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()
