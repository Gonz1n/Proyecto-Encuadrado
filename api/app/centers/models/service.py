from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.centers.models.center import Center
from app.db.base import Base


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
