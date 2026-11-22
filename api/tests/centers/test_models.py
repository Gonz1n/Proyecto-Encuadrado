import pytest
from sqlalchemy.exc import IntegrityError


def test_user_cannot_have_two_memberships_in_same_center(session, user_factory, center_factory, membership_factory):
    user = user_factory()
    center = center_factory()
    membership_factory(user=user, center=center)
    with pytest.raises(IntegrityError):
        membership_factory(user=user, center=center)
