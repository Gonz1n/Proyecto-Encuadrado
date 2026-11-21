from sqlalchemy import select

from app import seed
from app.centers.models import Role, Service

PAYLOAD = {"name": "Consulta", "price_clp": 1000, "duration_minutes": 30}


def admin_setup(membership_factory, auth_client):
    membership = membership_factory(role=Role.ADMIN)
    return membership.center, auth_client(membership.user)


def url(center, suffix=""):
    return f"/api/centers/{center.slug}/services/{suffix}"


def test_admin_creates_service_with_description(membership_factory, auth_client):
    center, client = admin_setup(membership_factory, auth_client)
    response = client.post(url(center), json={**PAYLOAD, "description": "Detalle"})
    assert response.status_code == 201
    assert response.json()["description"] == "Detalle"


def test_description_defaults_to_empty(membership_factory, auth_client):
    center, client = admin_setup(membership_factory, auth_client)
    assert client.post(url(center), json=PAYLOAD).json()["description"] == ""


def test_patch_updates_and_clears_description(membership_factory, auth_client):
    center, client = admin_setup(membership_factory, auth_client)
    service_id = client.post(url(center), json={**PAYLOAD, "description": "Uno"}).json()["id"]
    edited = client.patch(url(center, f"{service_id}/"), json={"description": "Dos"})
    assert edited.json()["description"] == "Dos"
    cleared = client.patch(url(center, f"{service_id}/"), json={"description": ""})
    assert cleared.status_code == 200
    assert cleared.json()["description"] == ""


def test_description_is_trimmed(membership_factory, auth_client):
    center, client = admin_setup(membership_factory, auth_client)
    response = client.post(url(center), json={**PAYLOAD, "description": "  Hola  "})
    assert response.json()["description"] == "Hola"


def test_description_over_300_is_rejected(membership_factory, auth_client):
    center, client = admin_setup(membership_factory, auth_client)
    response = client.post(url(center), json={**PAYLOAD, "description": "a" * 301})
    assert response.status_code == 400
    assert "description" in response.json()
    assert client.post(url(center), json={**PAYLOAD, "description": "a" * 300}).status_code == 201


def test_public_profile_services_include_description(client, center_factory, service_factory):
    center = center_factory()
    service_factory(center, description="Detalle publico")
    body = client.get(f"/api/public/centers/{center.slug}/").json()
    assert body["services"][0]["description"] == "Detalle publico"


def test_seed_sets_descriptions_only_for_services_it_creates(session):
    seed.run(session)
    service = session.scalar(select(Service).where(Service.name == "Sesión psicológica"))
    assert service.description.startswith("Atención individual")
    service.description = "Editada"
    session.flush()
    seed.run(session)
    assert service.description == "Editada"


def test_null_description_is_rejected(membership_factory, auth_client):
    center, client = admin_setup(membership_factory, auth_client)
    service_id = client.post(url(center), json={**PAYLOAD, "description": "Uno"}).json()["id"]
    patched = client.patch(url(center, f"{service_id}/"), json={"description": None})
    assert patched.status_code == 400
    assert "description" in patched.json()
    assert client.post(url(center), json={**PAYLOAD, "description": None}).status_code == 400
    listed = client.get(url(center)).json()
    assert [s["description"] for s in listed if s["id"] == service_id] == ["Uno"]
