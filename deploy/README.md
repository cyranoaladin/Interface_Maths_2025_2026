# Déploiement VPS — maths.labomaths.tn

Ce dépôt peut être déployé tel quel en site statique. Depuis la réorganisation, le webroot est `site/`.

## Secrets GitHub requis (Settings > Secrets and variables > Actions)
- SSH_PRIVATE_KEY: clé privée avec accès au VPS (utilisateur non root recommandé)
- VPS_HOST: maths.labomaths.tn (ou IP du VPS)
- VPS_USER: utilisateur SSH (ex: deployer)
- VPS_PATH: chemin racine de déploiement (ex: /var/www/maths)

## Workflow de déploiement
- Fichier: .github/workflows/deploy.yml
- Déclencheurs: push sur main et tags SemVer (`v*.*.*`), déclenchement manuel (workflow_dispatch)
- Build frontend (si présent), génération sitemap, puis rsync de `site/` vers `$VPS_PATH` (PDF exclus)

## Nginx — configuration d’exemple
Voir `deploy/nginx/maths.labomaths.tn.conf.sample` (HTTP) et le fichier `deploy/docker/nginx.conf` (dev docker) pour les en-têtes sécurité et le reverse proxy API.

Pour un déploiement HTTPS + HSTS, se référer au guide ci-dessous.

1) Copier la config et activer le site:
   sudo cp deploy/nginx/maths.labomaths.tn.conf.sample /etc/nginx/sites-available/maths.labomaths.tn
   sudo ln -s /etc/nginx/sites-available/maths.labomaths.tn /etc/nginx/sites-enabled/maths.labomaths.tn

2) Créer le dossier racine et donner les droits:
   sudo mkdir -p /var/www/maths
   sudo chown -R www-data:www-data /var/www/maths

3) Recharger Nginx:
   sudo nginx -t && sudo systemctl reload nginx

4) HTTPS (Let's Encrypt):
   sudo certbot --nginx -d maths.labomaths.tn
   # renouvellement auto: déjà géré par certbot.timer

### HTTPS + HSTS (production)
Consultez l’exemple de bloc serveur HTTPS ci-dessous (HSTS activé). Activez HSTS uniquement si tout le domaine est servi en HTTPS. Adaptez `ssl_certificate`/`ssl_certificate_key` selon votre AC.

server {
  listen 443 ssl http2;
  server_name maths.labomaths.tn;

  ssl_certificate /etc/letsencrypt/live/maths.labomaths.tn/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/maths.labomaths.tn/privkey.pem;

  root /var/www/maths;  # chemin vers votre webroot (notre "site/")
  index index.html;

  # HSTS (2 ans)
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

  # En-têtes sécurité (alignés avec deploy/docker/nginx.conf)
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header X-Frame-Options "DENY" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests" always;
}

server {
  listen 80;
  server_name maths.labomaths.tn;
  return 301 https://$host$request_uri;
}

## Publication
- HTML interactif: /EDS_terminale/Suites/fiche_eleve_suites_rappels_premiere.html
- Aperçu (GitHub Pages): /site/index.html

## Remarques
- Aucun secret ne doit être commité. Utiliser les secrets GitHub pour l’agent SSH.
- MathJax est servi via CDN HTTPS.
- Le contenu est statique: pas de backend requis.

