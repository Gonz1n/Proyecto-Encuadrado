def test_public_centers_list(client, center_factory):
    center_factory(name="Zeta", description="Ultimo")
    center_factory(name="Alfa", description="Primero")
    response = client.get("/api/public/centers/")
    assert response.status_code == 200
    body = response.json()
    names = [c["name"] for c in body]
    assert names == sorted(names)
    assert {"Alfa", "Zeta"} <= set(names)
    assert all(set(c) == {"slug", "name", "description"} for c in body)
