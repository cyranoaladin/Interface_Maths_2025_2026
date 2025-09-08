# Backend for Maths Portal - Recursive Content API

This backend exposes an API that mirrors your content folder tree exactly as it is on disk, with stable URLs for HTML pages.

Key features
- Strictly respects folder/subfolder structure (no flattening)
- Recursively lists only .html/.htm files
- Generates stable public URLs for Nginx mapping
- Configurable via environment variables (dotenv supported in dev)
- PEP8-compliant, with tests and CI workflow

Environment variables
- CONTENT_ROOT: Absolute path to your content root on disk.
  - Default: repository/site (auto-detected)
- STATIC_BASE_URL: Public base path that Nginx serves for CONTENT_ROOT.
  - Default: /content
- SERVE_STATIC: If "true", the backend serves static files at STATIC_BASE_URL (dev only; use Nginx in production).
  - Default: false
- CORS_ORIGINS: Comma-separated origins for CORS (optional).

Installation (dev)
1) Python 3.10+ recommended. From this directory:
   pip install -r requirements.txt

2) Optionally create a .env file:
   CONTENT_ROOT=/absolute/path/to/Interface_Maths_2025_2026
   STATIC_BASE_URL=/content
   SERVE_STATIC=true

3) Run the server:
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Endpoints
- GET /api/tree: returns the full tree (directories and HTML files)
- GET /api/tree/{subpath}: returns a subtree from the specified subpath

Nginx mapping (production)
Map STATIC_BASE_URL to CONTENT_ROOT in Nginx (read-only):

location /content/ {
    alias /srv/content/;  # must match CONTENT_ROOT on the server
    autoindex off;
    add_header Cache-Control "public, max-age=60";
}

Security and compliance
- No secrets hardcoded; all configurable via environment variables
- HTTPS with a valid TLS certificate must be used in production
- Tests and lint run in CI on each push


