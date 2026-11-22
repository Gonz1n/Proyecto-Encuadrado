from sqlalchemy import BigInteger, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.accounts.models.user import User
from app.centers.constants.roles import ROLE_LABELS, Role
from app.centers.models.center import Center
from app.db.base import Base


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
