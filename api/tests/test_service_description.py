import pytest
from sqlalchemy import select

from app.centers.models.service import Service
from app.db.seed.loaders import run as run_seed

PAYLOAD = {"name": "Consulta", "price_clp": 1000, "duration_minutes": 30}


def url(center, suffix=""):
    return f"/api/centers/{center.slug}/services/{suffix}"


@pytest.mark.parametrize(
    "extra,expected", [({"description": "Detalle"}, "Detalle"), ({}, ""), ({"description": "  Hola  "}, "Hola")]
)
def test_admin_creates_service_with_description(staff, extra, expected):
    member, client = staff()
    response = client.post(url(member.center), json={**PAYLOAD, **extra})
    assert response.status_code == 201
    assert response.json()["description"] == expected


def test_patch_updates_and_clears_description(staff):
    member, client = staff()
    service_id = client.post(url(member.center), json={**PAYLOAD, "description": "Uno"}).json()["id"]
    edited = client.patch(url(member.center, f"{service_id}/"), json={"description": "Dos"})
    assert edited.json()["description"] == "Dos"
    cleared = client.patch(url(member.center, f"{service_id}/"), json={"description": ""})
    assert cleared.status_code == 200
    assert cleared.json()["description"] == ""


def test_description_over_300_is_rejected(staff):
    member, client = staff()
    response = client.post(url(member.center), json={**PAYLOAD, "description": "a" * 301})
    assert response.status_code == 400
    assert "description" in response.json()
    assert client.post(url(member.center), json={**PAYLOAD, "description": "a" * 300}).status_code == 201


def test_public_profile_services_include_description(client, center_factory, service_factory):
    center = center_factory()
    service_factory(center, description="Detalle publico")
    body = client.get(f"/api/public/centers/{center.slug}/").json()
    assert body["services"][0]["description"] == "Detalle publico"


def test_seed_sets_descriptions_only_for_services_it_creates(session):
    run_seed(session)
    service = session.scalar(select(Service).where(Service.name == "Sesión psicológica"))
    assert service.description.startswith("Atención individual")
    service.description = "Editada"
    session.flush()
    run_seed(session)
    assert service.description == "Editada"


def test_null_description_is_rejected(staff):
    member, client = staff()
    service_id = client.post(url(member.center), json={**PAYLOAD, "description": "Uno"}).json()["id"]
    patched = client.patch(url(member.center, f"{service_id}/"), json={"description": None})
    assert patched.status_code == 400
    assert "description" in patched.json()
    assert client.post(url(member.center), json={**PAYLOAD, "description": None}).status_code == 400
    listed = client.get(url(member.center)).json()
    assert [s["description"] for s in listed if s["id"] == service_id] == ["Uno"]
