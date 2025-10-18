# Déploiement VPS – Interface Maths 2025–2026

## Pré‑requis

- Ubuntu 22.04
- Nginx, systemd
- Python 3.12

## Étapes

1. Cloner le dépôt dans `/opt/interface_maths`
2. Créer venv et installer backend:

```bash
cd /opt/interface_maths
python3 -m venv apps/backend/.venv
. apps/backend/.venv/bin/activate
pip install -U pip
pip install -r apps/backend/requirements.txt
```

3. Construire les assets (si applicable) et publier sous `site/assets/`.
4. Renseigner `.env.production` (voir README) et lancer bootstrap:

```bash
set -a; . .env.production; set +a
python3 apps/backend/scripts/bootstrap_prod.py
```

5. Installer le service systemd (exemple dans README) et démarrer:

```bash
sudo systemctl enable interface-maths --now
```

6. Configurer Nginx comme reverse‑proxy (voir README), recharger:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Sauvegardes

Voir docs/BACKUP_RESTORE.md
