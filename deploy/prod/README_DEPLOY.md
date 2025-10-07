# Déploiement maths.labomaths.tn (production)

## Pré-requis

- Nginx installé avec Certbot (cert déjà présent pour maths.labomaths.tn)
- Docker + Docker Compose
- Site statique disponible localement dans `site/`

## Étapes

1) Synchroniser le site statique

```bash
rsync -avz --delete Interface_Maths_2025_2026/site/ root@46.202.171.14:/var/www/maths/
```

2) Backend via Docker Compose (expose uniquement en localhost:8001)

```bash
scp deploy/prod/docker-compose.prod.yml root@46.202.171.14:/opt/maths_portal/docker-compose.yml
ssh root@46.202.171.14 'cd /opt/maths_portal && docker compose up -d --build && docker compose ps'
```

3) Nginx (vhost unifié /api → 127.0.0.1:8001)

```bash
scp deploy/prod/nginx.maths.labomaths.tn.conf root@46.202.171.14:/etc/nginx/sites-available/maths.labomaths.tn
ssh root@46.202.171.14 'ln -sf /etc/nginx/sites-available/maths.labomaths.tn /etc/nginx/sites-enabled/maths.labomaths.tn && nginx -t && systemctl reload nginx'
```

4) Vérifications

```bash
curl -I https://maths.labomaths.tn/
curl -I https://maths.labomaths.tn/content/index.html
curl -s -o /dev/null -w '%{http_code}\n' https://maths.labomaths.tn/api/v1/ping
```

## Variables d’environnement (backend)

- `SERVE_STATIC=false`
- `STATIC_BASE_URL=/content`
- `CONTENT_ROOT=/site`
- `CORS_ORIGINS=https://maths.labomaths.tn`
- `SECRET_KEY` (générer avec `openssl rand -hex 32`)
- `DATABASE_URL` (par défaut SQLite en conteneur, sinon Postgres)
- `TESTING=0`
