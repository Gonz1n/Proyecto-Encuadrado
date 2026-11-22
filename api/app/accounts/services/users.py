from sqlalchemy.orm import Session

from app.accounts.models.user import User
from app.accounts.schemas.profile import ProfileUpdate
from app.accounts.schemas.user import UserOut
from app.centers.repository import user_memberships


def build_user_out(session: Session, user: User) -> UserOut:
    fields = {name: getattr(user, name) for name in UserOut.model_fields if name != "memberships"}
    return UserOut(**fields, memberships=user_memberships(session, user))


def update_profile(session: Session, user: User, data: ProfileUpdate) -> UserOut:
    for field, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(user, field, value)
    session.commit()
    return build_user_out(session, user)
