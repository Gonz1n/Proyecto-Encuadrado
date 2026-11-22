from app.accounts import repository
from app.centers.models import Role


def login(client, email, password="clave-segura-123"):
    return client.post("/api/auth/login/", json={"email": email, "password": password})


def test_login_returns_token_and_memberships(client, membership_factory):
    membership = membership_factory(role=Role.ADMIN)
    response = login(client, membership.user.email)
    assert response.status_code == 200
    body = response.json()
    assert "token" in body
    first = body["user"]["memberships"][0]
    assert first["role"] == "admin"
    assert first["role_label"] == "Administrador"
    assert first["center"] == {"slug": membership.center.slug, "name": membership.center.name}


def test_login_with_wrong_password_returns_400(client, user_factory):
    user = user_factory()
    response = login(client, user.email, "otra")
    assert response.status_code == 400
    assert response.json()["detail"] == "Correo o contraseña incorrectos"


def test_me_without_token_returns_401(client):
    response = client.get("/api/auth/me/")
    assert response.status_code == 401
    assert response.json()["detail"] == "Las credenciales de autenticación no se proveyeron."
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_me_returns_current_user(auth_client, user_factory):
    user = user_factory()
    response = auth_client(user).get("/api/auth/me/")
    assert response.status_code == 200
    assert response.json()["email"] == user.email
    assert response.json()["full_name"] == user.full_name


def test_logout_invalidates_token(client, user_factory):
    user = user_factory()
    token = login(client, user.email).json()["token"]
    client.headers["Authorization"] = f"Bearer {token}"
    assert client.post("/api/auth/logout/").status_code == 204
    assert client.get("/api/auth/me/").status_code == 401


def test_inactive_user_token_returns_401(session, user_factory, auth_client):
    user = user_factory()
    c = auth_client(user)
    user.is_active = False
    session.flush()
    response = c.get("/api/auth/me/")
    assert response.status_code == 401
    assert response.json()["detail"] == "Token inválido."


def test_login_reuses_token(client, user_factory):
    user_factory(email="a@example.com")
    assert login(client, "a@example.com").json()["token"] == login(client, "a@example.com").json()["token"]


def test_login_normalizes_email_domain(client, user_factory):
    user_factory(email="a@example.com")
    assert login(client, "a@EXAMPLE.com").status_code == 200


def test_login_invalid_bodies_return_400_detail(client):
    expected = {"detail": "Correo o contraseña incorrectos"}
    for kwargs in (
        {"json": {}},
        {"json": {"email": "no-es-correo", "password": "x"}},
        {"json": {"email": "a@example.com"}},
        {"content": b""},
        {"content": b"no json", "headers": {"Content-Type": "application/json"}},
        {"json": [1, 2]},
    ):
        response = client.post("/api/auth/login/", **kwargs)
        assert response.status_code == 400
        assert response.json() == expected


def test_login_inactive_user_returns_400(session, client, user_factory):
    user = user_factory()
    user.is_active = False
    session.flush()
    assert login(client, user.email).status_code == 400


def test_malformed_and_unknown_token_return_401(client):
    assert client.get("/api/auth/me/", headers={"Authorization": "Token abc"}).status_code == 401
    response = client.get("/api/auth/me/", headers={"Authorization": "Bearer desconocido"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Token inválido."
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_login_user_without_password_returns_400(session, client):
    repository.create_user(session, email="sin@example.com")
    response = login(client, "sin@example.com")
    assert response.status_code == 400
    assert response.json() == {"detail": "Correo o contraseña incorrectos"}
