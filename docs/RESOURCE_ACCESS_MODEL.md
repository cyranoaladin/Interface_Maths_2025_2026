# Modele d'acces aux ressources

## Source actuelle

Les ressources pédagogiques restent majoritairement des pages HTML sous `site/`. Un manifeste transitoire est ajoute :

- `var-www/maths.labomaths.tn/Interface_Maths_2025_2026/site/assets/data/resources.json`

## Champs

- `id`
- `title`
- `description`
- `type` : `lesson`, `exercise`, `correction`, `method`, `evaluation`, `other`
- `level`
- `subject`
- `chapter`
- `group_code`
- `visibility` : `public`, `authenticated`, `group`, `teacher`, `admin`
- `url`
- `is_active`

## Regles

- `authenticated` : tout utilisateur connecte.
- `group` : membre du groupe indique par `group_code`.
- `teacher` : enseignant ou admin.
- `admin` : admin uniquement.
- `public` : prevu par le modele, a exposer sans token seulement si une route publique dediee est ajoutee.

## Routes

- `GET /resources/my` : liste filtree pour l'utilisateur courant.
- `GET /resources/{id}` : detail si visible, sinon `404`.

## Migration future

Le modele SQLAlchemy `Resource` est prepare dans `orm.py`. La prochaine etape consiste a importer le manifeste JSON en table et a ajouter `POST/PATCH/DELETE /resources` avec validations.
