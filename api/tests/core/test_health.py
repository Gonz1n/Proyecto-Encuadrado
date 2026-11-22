def test_health_is_public_and_ok(client):
    r = client.get("/api/health/")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
