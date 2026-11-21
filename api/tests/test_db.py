from app.accounts import repository
from app.accounts.security import verify_password


def test_user_is_created_with_email_as_username(session):
    user = repository.create_user(session, email="ana@Example.COM", password="x")
    assert user.email == "ana@example.com"
    assert verify_password("x", user.password)
