from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.centers.models.center import Center
from app.core import clock
from app.db.base import Base


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
