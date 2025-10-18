import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from apps.backend.app.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)


def test_password_hash_and_verify():
    pwd = "S3cure!"
    h = get_password_hash(pwd)
    assert h != pwd
    assert verify_password(pwd, h) is True
    assert verify_password("bad", h) is False


def test_jwt_creation():
    token = create_access_token(
        data={"sub": "user@example.com"},
        expires_minutes=1,
    )
    assert isinstance(token, str) and token.count(".") == 2
