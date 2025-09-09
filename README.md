# Interface Maths 2025–2026

Ressources pédagogiques pour l'année 2025–2026.

Ce dépôt contient notamment des fiches élèves prêtes à l'emploi (format HTML imprimable + PDF d’aperçu), suivant une charte graphique unifiée et un rendu LaTeX via MathJax.

## Structure

- `site/EDS_premiere/Calcul_litteral/`
  - `fiche_exercices_calcul_litteral_premiere.html` — Fiche exercices + méthodologie (Calcul littéral, EDS Première)
  - `fiche_exercices_calcul_litteral_premiere.pdf` — Aperçu impression (PDF)
- `site/EDS_terminale/Suites/`
  - `fiche_eleve_suites_rappels_premiere.html` — Fiche élève: Généralités sur les suites (Rappels de Première)
  - `fiche_eleve_suites_rappels_premiere.pdf` — Aperçu impression (PDF)

## Affichage local

Le site public est servi depuis le dossier `site/` (source de déploiement). Toute nouvelle fiche destinée au site doit être ajoutée sous `site/`.

Ouvrir le fichier HTML dans un navigateur moderne. Boutons inclus:
- Thème (clair/sombre)
- Retypage LaTeX (si nécessaire)
- Imprimer (ou générer un PDF via l’impression système)
- Tout déplier/replier (pour les corrections et détails)

## Démarrer en local (Docker)

- Prérequis: Docker
- Lancer la stack (Nginx + backend FastAPI):

```bash
# lance en arrière-plan
docker compose -f deploy/docker/docker-compose.yml up -d --build

# vérifications basiques
curl http://localhost/content/index.html   # doit renvoyer 200
curl http://localhost/api/tree             # doit renvoyer 200
```

- Arrêter:

```bash
docker compose -f deploy/docker/docker-compose.yml down
```

## Conventions

### Dossier des sorties (outputs)
- Les fichiers générés (ex: identifiants provisoires, import CSV → mots de passe) sont écrits dans un dossier d’outputs configurable.
- Par défaut: `apps/backend/outputs/` (ignoré par Git).
- Production/Docker: définir `OUTPUTS_DIR=/outputs` et monter un volume nommé (déjà configuré dans `deploy/docker/docker-compose.yml`).
- CI: le workflow définit `OUTPUTS_DIR` vers un répertoire temporaire du runner pour éviter tout effet de bord.
- Rappel sécurité: ne jamais publier ni committer ces fichiers. Ils contiennent des secrets temporaires.

- Les pages dans `site/` n'utilisent pas de chemins relatifs vers l'extérieur (`../`).
- Les PDF d'aperçu peuvent être régénérés localement via un navigateur Chromium/Chrome en mode headless.

- MathJax chargé via CDN HTTPS (aucune donnée sensible dans le dépôt)
- Pas de secrets en clair dans le code
- Rédaction en français, formules en LaTeX

## Licence

Ce dépôt est publié sous licence Creative Commons Attribution - Pas d’Utilisation Commerciale - Partage dans les Mêmes Conditions 4.0 International (CC BY-NC-SA 4.0).

- Vous devez créditer l’auteur.
- Pas d’usage commercial.
- Partage dans les mêmes conditions.

Détails: https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr

