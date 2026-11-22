from app.accounts.models import User

PROFILE = {
    "first_name": "Camila",
    "last_name": "Rojas",
    "title": "Psicóloga clínica",
    "university": "Universidad de Chile",
    "bio": "Atiendo adultos con enfoque cognitivo-conductual.",
    "health_registry": "123456",
}


def test_user_updates_own_profile(session, user_factory, auth_client):
    user = user_factory()
    response = auth_client(user).patch("/api/auth/me/", json=PROFILE)
    assert response.status_code == 200
    assert {key: response.json()[key] for key in PROFILE} == PROFILE
    assert response.json()["full_name"] == "Camila Rojas"
    session.expire_all()
    assert session.get(User, user.id).university == "Universidad de Chile"


def test_profile_requires_name(user_factory, auth_client):
    response = auth_client(user_factory()).patch("/api/auth/me/", json={"first_name": " "})
    assert response.status_code == 400
    assert "first_name" in response.json()


def test_profile_rejects_long_bio_and_bad_registry(user_factory, auth_client):
    client = auth_client(user_factory())
    body = {"bio": "a" * 501, "health_registry": "12A45"}
    response = client.patch("/api/auth/me/", json=body)
    assert response.status_code == 400
    assert {"bio", "health_registry"} <= set(response.json())


def test_profile_cannot_change_email(session, user_factory, auth_client):
    user = user_factory()
    original = user.email
    response = auth_client(user).patch("/api/auth/me/", json={"email": "otro@example.com", "desconocido": 1})
    assert response.status_code == 200
    session.expire_all()
    assert session.get(User, user.id).email == original


def test_profile_update_requires_token(client):
    assert client.patch("/api/auth/me/", json=PROFILE).status_code == 401


def test_profile_allows_partial_update(user_factory, auth_client):
    response = auth_client(user_factory()).patch("/api/auth/me/", json={"title": "Psicóloga"})
    assert response.status_code == 200
    assert response.json()["title"] == "Psicóloga"
    assert "avatar_url" not in response.json()
