import pytest
from sqlalchemy import select

from app.centers.models import Center, Role
from app.db.seed.loaders import run as run_seed

PHONE_ERROR = "Ingresa un teléfono válido, por ejemplo +56 2 2345 6789"
EMAIL_ERROR = "Ingresa un correo válido"
FIELDS = {
    "address": "Av. Providencia 1234, oficina 502",
    "commune": "Providencia",
    "phone": "+56 2 2345 6789",
    "email": "contacto@centroaurora.cl",
}


def url(center):
    return f"/api/centers/{center.slug}/"


def test_admin_sets_contact_fields(staff):
    member, client = staff(Role.ADMIN)
    response = client.patch(url(member.center), json=FIELDS)
    assert response.status_code == 200
    for key, value in FIELDS.items():
        assert response.json()[key] == value
    assert client.get(url(member.center)).json()["email"] == FIELDS["email"]


@pytest.mark.parametrize("role", [Role.MEMBER, Role.VIEWER])
def test_non_admin_cannot_set_contact(staff, role):
    member, client = staff(role)
    assert client.patch(url(member.center), json=FIELDS).status_code == 403


@pytest.mark.parametrize("phone", ["12", "abc", "+56 2"])
def test_invalid_phone_rejected(staff, phone):
    member, client = staff(Role.ADMIN)
    response = client.patch(url(member.center), json={"phone": phone})
    assert response.status_code == 400
    assert response.json()["phone"] == [PHONE_ERROR]


@pytest.mark.parametrize("phone", ["+56 2 2345 6789", "222345678", "+56912345678"])
def test_valid_phone_accepted(staff, phone):
    member, client = staff(Role.ADMIN)
    response = client.patch(url(member.center), json={"phone": phone})
    assert response.status_code == 200
    assert response.json()["phone"] == phone


@pytest.mark.parametrize("email", ["sin-arroba", "a@b", "a b@c.cl"])
def test_invalid_email_rejected(staff, email):
    member, client = staff(Role.ADMIN)
    response = client.patch(url(member.center), json={"email": email})
    assert response.status_code == 400
    assert response.json()["email"] == [EMAIL_ERROR]


def test_blank_clears_each_field(staff):
    member, client = staff(Role.ADMIN)
    client.patch(url(member.center), json=FIELDS)
    response = client.patch(url(member.center), json={key: "" for key in FIELDS})
    assert response.status_code == 200
    assert all(response.json()[key] == "" for key in FIELDS)


def test_public_profile_exposes_contact(client, center_factory):
    center = center_factory(**FIELDS)
    body = client.get(f"/api/public/centers/{center.slug}/").json()
    for key, value in FIELDS.items():
        assert body[key] == value


def test_seed_creates_demo_contact_for_new_center_only(session):
    run_seed(session)
    aurora = session.scalar(select(Center).where(Center.slug == "centro-aurora"))
    assert aurora.address == "Av. Providencia 1234, oficina 502"
    assert aurora.email == "contacto@centroaurora.cl"
    aurora.phone = ""
    session.flush()
    run_seed(session)
    assert aurora.phone == ""
    nutrir = session.scalar(select(Center).where(Center.slug == "clinica-nutrir"))
    assert (nutrir.commune, nutrir.phone) == ("Las Condes", "+56 2 2987 6543")
