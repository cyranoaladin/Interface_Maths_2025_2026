from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from sqlalchemy import Table, Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship, Session

from .db import Base, engine
from .config import settings
from .security import get_password_hash


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
    role: Mapped[str] = mapped_column(String(32), default="student")  # 'student' | 'teacher'
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    groups: Mapped[List[Group]] = relationship(
        Group, secondary=user_groups, back_populates="members", lazy="selectin"
    )


# Pydantic-style response models (dataclasses sufficient for FastAPI response_model)
@dataclass
class UserRead:
    id: int
    email: str
    full_name: str
    role: str


@dataclass
class GroupRead:
    id: int
    code: str
    name: str


DEFAULT_GROUPS = [
    ("T-EDS-3", "Terminale EDS Maths — Groupe 3"),
    ("P-EDS-6", "Première EDS Maths — Groupe 6"),
    ("MX-1", "Maths expertes — Groupe 1"),
]


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
    hashed = get_password_hash(provisional_password)
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
    # Create defaults
    Base.metadata.create_all(bind=engine)
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
        return ""
    password = token_urlsafe(10)
    user = User(email=email, full_name=full_name, role="student", hashed_password=get_password_hash(password))
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

