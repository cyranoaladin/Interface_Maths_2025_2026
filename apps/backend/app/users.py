from __future__ import annotations
from .schemas.groups import GroupPublic

from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timezone

from sqlalchemy import Table, Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship, Session

from pathlib import Path

from .db import Base, engine
from .config import settings


# Association table user<->group
user_groups = Table(
    "user_groups",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True),
    UniqueConstraint("user_id", "group_id", name="uq_user_group"),
)


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))

    members: Mapped[List["User"]] = relationship(
        "User", secondary=user_groups, back_populates="groups", lazy="selectin"
    )


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    # Champs explicites pour prénom/nom
    first_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    role: Mapped[str] = mapped_column(String(32), default="student")  # 'student' | 'teacher'
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    groups: Mapped[List[Group]] = relationship(
        Group, secondary=user_groups, back_populates="members", lazy="selectin"
    )


def split_full_name(full_name: str) -> tuple[str | None, str | None]:
    """Split a user's full name into first/last components."""
    name = (full_name or "").strip()
    if not name:
        return None, None
    parts = [p for p in name.split() if p]
    if len(parts) == 1:
        # Single token: treat as last_name, unknown first_name
        return None, parts[0]
    # First token as first_name, the rest as last_name (supports composed last names)
    first = parts[0]
    last = " ".join(parts[1:])
    return first, last

# Pydantic-style response models (dataclasses sufficient for FastAPI response_model)


@dataclass
class UserPublic:
    id: int
    email: str
    full_name: str | None
    role: str
    first_name: str | None = None
    last_name: str | None = None


DEFAULT_GROUPS = [
    ("T-EDS-3", "Terminale EDS Maths — Groupe 3"),
    ("P-EDS-6", "Première EDS Maths — Groupe 6"),
    ("MX-1", "Maths expertes — Groupe 1"),
]


def _hash_password(password: str) -> str:
    """Hash helper that avoids importing security at module import time."""
    from .security import get_password_hash as hash_password

    return hash_password(password)


def _ensure_group(db: Session, code: str, name: str) -> Group:
    grp = db.query(Group).filter_by(code=code).one_or_none()
    if grp:
        return grp
    grp = Group(code=code, name=name)
    db.add(grp)
    db.commit()
    db.refresh(grp)
    return grp


def _ensure_teacher(db: Session, email: str, full_name: Optional[str] = None) -> User:
    usr = db.query(User).filter_by(email=email).one_or_none()
    if usr:
        # Ensure role
        if usr.role != "teacher":
            usr.role = "teacher"
            db.commit()
        return usr
    # Generate a provisional password and store to outputs file for admin to communicate
    from secrets import token_urlsafe

    provisional_password = token_urlsafe(12)
    hashed = _hash_password(provisional_password)
    usr = User(email=email, full_name=full_name or email, role="teacher", hashed_password=hashed)
    db.add(usr)
    db.commit()
    db.refresh(usr)

    # Write credential to outputs file (never to logs)
    out_dir = settings.OUTPUTS_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    out_file = out_dir / f"bootstrap_credentials_{ts}.csv"
    try:
        with out_file.open("a", encoding="utf-8") as f:
            f.write("email,full_name,role,provisional_password\n")
            f.write(f"{usr.email},{usr.full_name},{usr.role},{provisional_password}\n")
    except Exception:
        # Best-effort only
        pass
    return usr


def ensure_bootstrap() -> None:
    # SQLite safety: make sure the target directory exists even if engine was
    # created before the repo tree was fully prepared on CI.
    if engine.url.drivername.startswith("sqlite") and engine.url.database:
        Path(engine.url.database).parent.mkdir(parents=True, exist_ok=True)
    # Create defaults
    Base.metadata.create_all(bind=engine)
    # Lightweight migration for first_name/last_name on SQLite
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN first_name VARCHAR(128)")
    except Exception:
        pass
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN last_name VARCHAR(128)")
    except Exception:
        pass
    with Session(bind=engine) as db:
        # Groups
        code_to_group = {}
        for code, name in DEFAULT_GROUPS:
            code_to_group[code] = _ensure_group(db, code, name)

        # Teachers
        for email in settings.TEACHER_EMAILS:
            if not email:
                continue
            teacher = _ensure_teacher(db, email=email, full_name=email)
            # Assign teacher to default groups
            for grp in code_to_group.values():
                if grp not in teacher.groups:
                    teacher.groups.append(grp)
            db.commit()


# Utility to create a student (used by import script/tests)

def create_student(db: Session, email: str, full_name: str, group_codes: List[str]) -> str:
    from secrets import token_urlsafe

    existing = db.query(User).filter_by(email=email).one_or_none()
    if existing:
        # Ensure groups are attached even if the user already exists
        for code in group_codes:
            grp = db.query(Group).filter_by(code=code).one_or_none()
            if not grp:
                grp = Group(code=code, name=code)
                db.add(grp)
                db.flush()
            if grp not in existing.groups:
                existing.groups.append(grp)
        # Update full name if missing or placeholder
        if not existing.full_name or existing.full_name == existing.email:
            existing.full_name = full_name
        db.commit()
        return ""
    # Use global default if provided to have same provisional password for all
    password = settings.DEFAULT_STUDENT_PASSWORD or token_urlsafe(10)
    first, last = split_full_name(full_name)
    user = User(
        email=email,
        full_name=full_name,
        first_name=first,
        last_name=last,
        role="student",
        hashed_password=_hash_password(password),
    )
    db.add(user)
    # Attach groups
    for code in group_codes:
        grp = db.query(Group).filter_by(code=code).one_or_none()
        if not grp:
            # create on the fly
            grp = Group(code=code, name=code)
            db.add(grp)
            db.flush()
        user.groups.append(grp)
    db.commit()
    return password


# Backward-compat for legacy imports
GroupRead = GroupPublic
