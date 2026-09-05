FROM python:3.11-slim-bookworm@sha256:528257d48c1da0dcecc2e725d1ae34498d60c965f1241e39cd6a85a8859bdf84
ARG VCS_REF
ARG BUILD_DATE
ARG RELEASE_ID
LABEL org.opencontainers.image.source="https://github.com/cyranoaladin/Interface_Maths_2025_2026" \
      org.opencontainers.image.revision="$VCS_REF" \
      org.opencontainers.image.created="$BUILD_DATE" \
      org.opencontainers.image.version="$RELEASE_ID"
WORKDIR /code
COPY requirements.txt constraints.txt requirements.lock.txt ./
RUN pip install --no-cache-dir --require-hashes --only-binary=:all: -r requirements.lock.txt -c constraints.txt
COPY app ./app
# Inline preflight check
RUN SECRET_KEY=build-preflight DATABASE_URL="sqlite:////tmp/preflight.db" \
    python -c "import importlib; [importlib.import_module(m) for m in ['app.main','app.orm','app.routers.auth','app.routers.groups']]; print('Preflight OK')"
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request,sys; u=urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3); sys.exit(0 if u.status==200 else 1)"
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
