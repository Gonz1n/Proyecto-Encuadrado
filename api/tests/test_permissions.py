import pytest
from fastapi import APIRouter

from app.centers.access import AdminDep, CenterDep
from app.centers.models import Role
from app.main import app

probe = APIRouter(prefix="/api/centers/{slug}/_probe")


@probe.get("/")
def probe_get(access: CenterDep) -> dict:
    return {"slug": access.center.slug, "role": access.membership.role}


@probe.post("/")
def probe_post(access: AdminDep) -> dict:
    return {"ok": True}


@pytest.fixture(autouse=True)
def probe_routes(client):
    before = len(app.router.routes)
    app.include_router(probe)
    yield
    del app.router.routes[before:]


def path(center):
    return f"/api/centers/{center.slug}/_probe/"


def test_no_token_on_unknown_center_returns_401(client):
    assert client.get("/api/centers/nope/_probe/").status_code == 401


def test_token_without_membership_returns_404(auth_client, user_factory, center_factory):
    center = center_factory()
    client = auth_client(user_factory())
    assert client.get(path(center)).status_code == 404
    assert client.post(path(center)).status_code == 404


def test_unknown_center_returns_404(auth_client, user_factory):
    response = auth_client(user_factory()).get("/api/centers/nope/_probe/")
    assert response.status_code == 404
    assert response.json() == {"detail": "No encontrado."}


@pytest.mark.parametrize("role", [Role.VIEWER, Role.MEMBER])
def test_non_admin_post_returns_403(role, auth_client, membership_factory):
    membership = membership_factory(role=role)
    response = auth_client(membership.user).post(path(membership.center))
    assert response.status_code == 403
    assert response.json() == {"detail": "No tienes permiso para realizar esta acción."}


def test_admin_post_is_allowed(auth_client, membership_factory):
    membership = membership_factory(role=Role.ADMIN)
    assert auth_client(membership.user).post(path(membership.center)).status_code == 200


@pytest.mark.parametrize("role", [Role.ADMIN, Role.MEMBER, Role.VIEWER])
def test_any_member_get_returns_200(role, auth_client, membership_factory):
    membership = membership_factory(role=role)
    response = auth_client(membership.user).get(path(membership.center))
    assert response.status_code == 200
    assert response.json() == {"slug": membership.center.slug, "role": role}


@pytest.mark.parametrize("method", ["get", "post"])
def test_anonymous_without_is_authenticated_returns_401(method, client, center_factory):
    center = center_factory()
    assert getattr(client, method)(path(center)).status_code == 401
