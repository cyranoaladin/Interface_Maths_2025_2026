# Déploiement VPS — maths.labomaths.tn

Ce dépôt peut être déployé tel quel en site statique.

## Secrets GitHub requis (Settings > Secrets and variables > Actions)
- SSH_PRIVATE_KEY: clé privée avec accès au VPS (utilisateur non root recommandé)
- VPS_HOST: maths.labomaths.tn (ou IP du VPS)
- VPS_USER: utilisateur SSH (ex: deployer)
- VPS_PATH: chemin racine de déploiement (ex: /var/www/maths)

## Workflow de déploiement
- Fichier: .github/workflows/deploy.yml
- Déclencheurs: push sur main (fichiers site) et déclenchement manuel (workflow_dispatch)
- Action: rsync de `EDS_terminale/` et `docs/` vers `$VPS_PATH`

## Nginx — configuration d’exemple
Voir `deploy/nginx/maths.labomaths.tn.conf.sample`. Exemple de mise en place:

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

## Publication
- HTML interactif: /EDS_terminale/Suites/fiche_eleve_suites_rappels_premiere.html
- Aperçu (GitHub Pages): /docs/index.html

## Remarques
- Aucun secret ne doit être commité. Utiliser les secrets GitHub pour l’agent SSH.
- MathJax est servi via CDN HTTPS.
- Le contenu est statique: pas de backend requis.

