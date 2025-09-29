from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_root_alive():
    r = client.get("/")
    assert r.status_code in (200, 307, 308)

def test_token_requires_credentials():
    r = client.post("/auth/token", data={"username":"x","password":"y"})
    assert r.status_code in (400, 401)
