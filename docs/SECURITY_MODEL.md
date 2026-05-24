# Modele de securite

## Roles

- `student` : voit son profil, ses groupes, ses ressources autorisees et ses propres bilans.
- `teacher` : voit uniquement les groupes auxquels il est associe, leurs eleves, leurs evaluations et les bilans des eleves de ces groupes.
- `admin` : voit tous les groupes et utilisateurs, et accede aux routes `/admin/*`.

## Dependances backend

- `get_current_user` : valide le JWT, charge l'utilisateur actif, renvoie `401` si token absent/invalide/expire.
- `require_active_user` : alias explicite pour un utilisateur connecte actif.
- `require_teacher` : accepte `teacher` et `admin`, renvoie `403` pour un eleve.
- `require_admin` : accepte uniquement `admin`, renvoie `403` sinon.
- `can_manage_group` : admin tous groupes, teacher seulement ses groupes.
- `shares_group_with` : autorise les actions enseignant-eleve si un groupe est commun.

## Endpoints durcis

- `/groups/` : teacher limite a ses groupes, admin tous groupes.
- `/groups/{code}/students` : teacher limite au groupe associe, admin tous groupes.
- `/auth/reset-student-password` : teacher limite aux eleves de ses groupes, admin tous eleves.
- `/admin/users`, `/admin/groups` : admin uniquement.
- `/resources/my`, `/resources/{id}` : filtrage backend selon visibilite et groupes.
- `/evaluations/my`, `/evaluations/{id}/my-report`, `/teacher/...` : filtrage backend selon role et groupes.

## Secrets et mots de passe

- `SECRET_KEY` reste obligatoire en production via `APP_ENV=production`.
- Les mots de passe ne sont jamais retournes sauf mot de passe temporaire genere lors d'un reset explicite.
- `must_change_password` est prepare en base et positionne lors de creation/reset.
- Les exports de credentials restent dans `apps/backend/outputs/`, ignore par Git.

## Codes HTTP

- `401` : non connecte ou token invalide.
- `403` : connecte mais role insuffisant.
- `404` : ressource, groupe, eleve ou bilan absent ou non visible pour l'utilisateur.
