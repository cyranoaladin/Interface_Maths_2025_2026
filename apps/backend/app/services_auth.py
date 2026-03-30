from sqlalchemy.orm import Session
from . import security
from .orm import User

def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email).one_or_none()
    if not user or not security.verify_password(password, user.hashed_password):
        return None
    return user
