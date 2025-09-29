from app.security import get_password_hash, verify_password, create_access_token
from datetime import timedelta

def test_password_hash_and_verify():
    pwd = "S3cure!"
    h = get_password_hash(pwd)
    assert h != pwd
    assert verify_password(pwd, h) is True
    assert verify_password("bad", h) is False

def test_jwt_creation():
    token = create_access_token(data={"sub": "user@example.com"}, expires_delta=timedelta(minutes=1))
    assert isinstance(token, str) and token.count(".") == 2
