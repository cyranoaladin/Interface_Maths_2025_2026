FROM python:3.11-slim-bookworm
WORKDIR /code
COPY requirements.txt constraints.txt ./
RUN pip install --no-cache-dir -r requirements.txt -c constraints.txt
COPY . .
# Inline preflight check (avoids dependency on scripts/ outside backend)
RUN SECRET_KEY=build-preflight DATABASE_URL="sqlite:////tmp/preflight.db" \
    python -c "import importlib; [importlib.import_module(m) for m in ['app.main','app.users','app.routers.auth','app.routers.groups']]; print('Preflight OK')"
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request,sys; u=urllib.request.urlopen('http://127.0.0.1:8000/api/v1/ping', timeout=3); sys.exit(0 if u.status==200 else 1)"
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
