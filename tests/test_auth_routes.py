import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


def test_root_alive(client):
    response = client.get("/")
    assert response.status_code in (200, 307, 308)


def test_token_requires_credentials(client):
    response = client.post(
        "/auth/token",
        data={"username": "x", "password": "y"},
    )
    assert response.status_code in (400, 401)
