import re
with open('apps/backend/app/main.py', 'r') as f:
    c = f.read()

# Replace on_event with lifespan
c = c.replace('from contextlib import suppress', 'from contextlib import suppress, asynccontextmanager')
c = re.sub(
    r'@app\.on_event\("startup"\)\s+async def on_startup_create_schema_and_bootstrap\(\):\s+"""[\s\S]*?(?=@lru_cache)',
    """@asynccontextmanager
async def lifespan(app: FastAPI):
    \"\"\"
    On startup:
    1. Ensures the database schema is created.
    2. Optionally bootstraps default user groups.
    3. Ensures a favicon exists to avoid 404s.
    \"\"\"
    env = (os.getenv("APP_ENV") or config.settings.APP_ENV or "development").lower()
    if env in {"production", "prod"} and not config.settings.SECRET_KEY:
        raise RuntimeError("SECRET_KEY is required when APP_ENV=production")

    with suppress(Exception):
        db.Base.metadata.create_all(bind=db.engine)

    # Optional: auto-bootstrap groups in production when AUTO_BOOTSTRAP=1
    if os.getenv("AUTO_BOOTSTRAP") == "1":
        with Session(bind=db.engine) as session:
            defaults = [
                ("T-EDS-3", "Terminale EDS Maths — Groupe 3"),
                ("P-EDS-6", "Première EDS Maths — Groupe 6"),
                ("MX-1", "Maths expertes — Groupe 1"),
            ]
            for code, name in defaults:
                g = session.query(orm.Group).filter_by(code=code).one_or_none()
                if not g:
                    session.add(orm.Group(code=code, name=name))
            session.commit()

    # Ensure favicon exists at site root to avoid 404 from StaticFiles mounts
    with suppress(Exception):
        root_dir = Path(str(config.settings.CONTENT_ROOT))
        ico = root_dir / "favicon.ico"
        if not ico.is_file():
            svg = root_dir / "assets" / "img" / "icon.svg"
            if svg.is_file():
                shutil.copyfile(svg, ico)
    
    yield

""",
    c
)

c = c.replace('app = FastAPI(title="Maths Portal API")', 'app = FastAPI(title="Maths Portal API", lifespan=lifespan)')

with open('apps/backend/app/main.py', 'w') as f:
    f.write(c)
