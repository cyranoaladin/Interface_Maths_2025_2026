# Changelog refactor auth dashboards

## 2026-05-24

- Ajout de l'audit architecture/auth/dashboards.
- Ajout du role `admin` dans le modele d'autorisation.
- Renforcement de `require_teacher`, ajout `require_admin`, `require_active_user`, `can_manage_group`, `shares_group_with`.
- Ajout de colonnes preparees pour `must_change_password`, `updated_at`, `last_login_at` et metadonnees de groupes.
- Preparation des modeles `Resource`, `Evaluation`, `StudentReport`.
- Ajout du router `/admin`.
- Restriction des groupes et eleves visibles par enseignant.
- Restriction du reset mot de passe aux eleves des groupes de l'enseignant.
- Ajout du manifeste `site/assets/data/resources.json`.
- Ajout des routes `/resources/my`, `/resources/{id}`.
- Ajout des routes `/evaluations/my`, `/evaluations/{id}/my-report`, `/teacher/groups/{code}/evaluations`, `/teacher/students/{student_id}/reports`.
- Ajout d'un client API frontend centralise `site/assets/js/api-client.js`.
- Adaptation de `auth.js`, `student.js`, `dashboard.js` pour utiliser les APIs filtrees par le backend.
- Ajout de tests backend sur autorisations, ressources et bilans.
