import pytest

from app.centers.constants.roles import Role
from app.centers.models.service import Service
from app.centers.repositories import memberships
from app.shared.validators.phone import normalize_phone

ADMIN = Role.ADMIN
MEMBER = Role.MEMBER
VIEWER = Role.VIEWER
SERVICE = {"name": "Consulta", "price_clp": 1000, "duration_minutes": 30}


def url(center, suffix=""):
    return f"/api/centers/{center.slug}/{suffix}"


def test_bookable_queryset_excludes_viewers(session, membership_factory, center_factory):
    center = center_factory()
    admin = membership_factory(role=Role.ADMIN, center=center)
    member = membership_factory(role=Role.MEMBER, center=center)
    membership_factory(role=Role.VIEWER, center=center)
    assert set(memberships.bookable_memberships(session, center.id)) == {admin, member}


@pytest.mark.parametrize(
    "value",
    ["+56 9 1234 5678", "912345678", "9 1234 5678", "56912345678"],
)
def test_normalize_phone_accepts_chilean_mobiles(value):
    assert normalize_phone(value) == "+56912345678"


@pytest.mark.parametrize("value", ["+56 9 1234 567", "12345", "٩١٢٣٤٥٦٧٨"])
def test_normalize_phone_rejects_invalid(value):
    assert normalize_phone(value) is None


@pytest.mark.parametrize("role", [ADMIN, MEMBER, VIEWER])
def test_any_role_reads_center(staff, role):
    member, client = staff(role)
    response = client.get(url(member.center))
    assert response.status_code == 200
    assert response.json() == {
        "name": member.center.name,
        "slug": member.center.slug,
        "description": "",
        "opening_time": "09:00",
        "closing_time": "18:00",
        "lunch_start": None,
        "lunch_end": None,
        "terms": "",
        "website_url": "",
        "instagram_url": "",
        "facebook_url": "",
        "linkedin_url": "",
        "whatsapp_number": "",
        "address": "",
        "commune": "",
        "phone": "",
        "email": "",
        "open_days": [0, 1, 2, 3, 4, 5, 6],
    }


def test_admin_updates_center(staff):
    member, client = staff(ADMIN)
    response = client.patch(url(member.center), json={"name": "Nuevo nombre", "opening_time": "08:30", "slug": "otro"})
    assert response.status_code == 200
    assert response.json()["name"] == "Nuevo nombre"
    assert response.json()["opening_time"] == "08:30"
    assert response.json()["slug"] == member.center.slug
    assert response.json()["closing_time"] == "18:00"


@pytest.mark.parametrize(
    "role,payload",
    [
        (MEMBER, {"name": "x"}),
        (VIEWER, {"name": "x"}),
        (MEMBER, {"website_url": "https://centroaurora.cl"}),
        (MEMBER, {"open_days": [0]}),
    ],
)
def test_non_admin_cannot_update_center(staff, role, payload):
    member, client = staff(role)
    assert client.patch(url(member.center), json=payload).status_code == 403


def test_admin_of_other_center_gets_404(staff, center_factory):
    _, client = staff(ADMIN)
    other = center_factory()
    assert client.patch(url(other), json={"name": "x"}).status_code == 404


def test_description_longer_than_400_is_rejected(staff):
    member, client = staff(ADMIN)
    assert client.patch(url(member.center), json={"description": "a" * 401}).status_code == 400


def test_closing_before_opening_is_rejected(staff):
    member, client = staff(ADMIN)
    response = client.patch(url(member.center), json={"opening_time": "18:00", "closing_time": "09:00"})
    assert response.status_code == 400
    assert response.json() == {"closing_time": ["El horario de término debe ser posterior al de inicio"]}


def test_single_time_is_checked_against_stored_value(staff):
    member, client = staff(ADMIN)
    response = client.patch(url(member.center), json={"opening_time": "18:00"})
    assert response.status_code == 400
    assert "closing_time" in response.json()
    assert client.patch(url(member.center), json={"closing_time": "09:00"}).status_code == 400


def test_admin_saves_and_clears_social_links(staff):
    member, client = staff(ADMIN)
    links = {
        "website_url": "https://centroaurora.cl",
        "instagram_url": "https://www.instagram.com/centroaurora",
        "facebook_url": "https://facebook.com/centroaurora",
        "linkedin_url": "https://www.linkedin.com/company/centroaurora",
    }
    response = client.patch(url(member.center), json=links)
    assert response.status_code == 200
    assert {key: response.json()[key] for key in links} == links
    cleared = client.patch(url(member.center), json={"instagram_url": ""})
    assert cleared.json()["instagram_url"] == ""


def test_invalid_social_url_is_rejected(staff):
    member, client = staff(ADMIN)
    response = client.patch(url(member.center), json={"website_url": "no es un enlace"})
    assert response.status_code == 400
    assert "website_url" in response.json()


@pytest.mark.parametrize(
    "field,value,network",
    [
        ("instagram_url", "https://facebook.com/centroaurora", "Instagram"),
        ("facebook_url", "https://instagram.com/centroaurora", "Facebook"),
        ("linkedin_url", "https://evil.com/linkedin.com", "LinkedIn"),
    ],
)
def test_social_link_must_match_its_network(staff, field, value, network):
    member, client = staff(ADMIN)
    response = client.patch(url(member.center), json={field: value})
    assert response.status_code == 400
    assert response.json()[field] == [f"El enlace debe ser de {network}"]


def test_admin_sets_open_days_sorted_and_unique(staff):
    member, client = staff(ADMIN)
    response = client.patch(url(member.center), json={"open_days": [4, 0, 2, 0]})
    assert response.status_code == 200
    assert response.json()["open_days"] == [0, 2, 4]


@pytest.mark.parametrize("value", [[], [7], [-1]])
def test_invalid_open_days_are_rejected(staff, value):
    member, client = staff(ADMIN)
    response = client.patch(url(member.center), json={"open_days": value})
    assert response.status_code == 400
    assert "open_days" in response.json()
    if not value:
        assert response.json()["open_days"] == ["Selecciona al menos un día de atención"]


@pytest.mark.parametrize("number", ["+56 9 1234 5678", "912345678", "56912345678"])
def test_admin_saves_whatsapp_normalized(staff, number):
    member, client = staff(ADMIN)
    response = client.patch(url(member.center), json={"whatsapp_number": number})
    assert response.status_code == 200
    assert response.json()["whatsapp_number"] == "+56912345678"


def test_invalid_whatsapp_is_rejected_and_blank_clears(staff):
    member, client = staff(ADMIN)
    response = client.patch(url(member.center), json={"whatsapp_number": "12345"})
    assert response.status_code == 400
    assert response.json()["whatsapp_number"] == ["Ingresa un celular chileno válido"]
    assert client.patch(url(member.center), json={"whatsapp_number": ""}).json()["whatsapp_number"] == ""


def test_member_cannot_create_service(staff):
    member, client = staff(MEMBER)
    assert client.post(url(member.center, "services/"), json=SERVICE).status_code == 403


def test_admin_creates_edits_and_deletes_service(staff, session):
    member, client = staff(ADMIN)
    created = client.post(url(member.center, "services/"), json=SERVICE)
    assert created.status_code == 201
    service_id = created.json()["id"]
    edited = client.patch(url(member.center, f"services/{service_id}/"), json={"price_clp": 2000})
    assert edited.status_code == 200
    assert edited.json()["price_clp"] == 2000
    assert edited.json()["name"] == "Consulta"
    assert client.delete(url(member.center, f"services/{service_id}/")).status_code == 204
    listing = client.get(url(member.center, "services/"))
    assert [s["id"] for s in listing.json()] == []
    assert session.get(Service, service_id).is_active is False
    assert client.patch(url(member.center, f"services/{service_id}/"), json={"price_clp": 5}).status_code == 404
    assert client.delete(url(member.center, f"services/{service_id}/")).status_code == 404


def test_service_of_other_center_is_404(staff, service_factory):
    member, client = staff(ADMIN)
    foreign = service_factory()
    assert client.patch(url(member.center, f"services/{foreign.id}/"), json={"price_clp": 5}).status_code == 404
    assert client.delete(url(member.center, f"services/{foreign.id}/")).status_code == 404


def test_service_duration_must_be_multiple_of_15(staff):
    member, client = staff(ADMIN)
    response = client.post(url(member.center, "services/"), json={**SERVICE, "duration_minutes": 20})
    assert response.status_code == 400
    assert response.json()["duration_minutes"] == ["La duración debe ser múltiplo de 15 minutos"]


@pytest.mark.parametrize("price", [0, 10_000_001])
def test_service_price_out_of_range_is_rejected(staff, price):
    member, client = staff(ADMIN)
    assert client.post(url(member.center, "services/"), json={**SERVICE, "price_clp": price}).status_code == 400


def test_services_list_is_active_only_sorted_by_name(staff, service_factory):
    member, client = staff(VIEWER)
    service_factory(center=member.center, name="Zeta")
    service_factory(center=member.center, name="Alfa")
    service_factory(center=member.center, name="Baja", is_active=False)
    response = client.get(url(member.center, "services/"))
    assert [s["name"] for s in response.json()] == ["Alfa", "Zeta"]
    assert set(response.json()[0]) == {"id", "name", "price_clp", "duration_minutes", "description"}


def test_members_lists_all_roles(staff, membership_factory):
    member, client = staff(VIEWER)
    membership_factory(role=ADMIN, center=member.center)
    membership_factory(role=MEMBER, center=member.center)
    response = client.get(url(member.center, "members/"))
    assert response.status_code == 200
    data = response.json()
    assert [m["role"] for m in data] == ["admin", "member", "viewer"]
    first = data[0]
    assert first["role_label"] == "Administrador"
    assert set(first) == {"id", "role", "role_label", "user"}
    assert set(first["user"]) == {"full_name", "email", "title"}


def test_terms_are_trimmed_and_limited_to_5000(staff):
    member, client = staff(ADMIN)
    saved = client.patch(url(member.center), json={"terms": "  Texto  "})
    assert saved.status_code == 200
    assert saved.json()["terms"] == "Texto"
    assert client.patch(url(member.center), json={"terms": "a" * 5000}).status_code == 200
    too_long = client.patch(url(member.center), json={"terms": "a" * 5001})
    assert too_long.status_code == 400
    assert "terms" in too_long.json()
