# Plan de test

## Backend

Commande principale :

```bash
cd var-www/maths.labomaths.tn/Interface_Maths_2025_2026
pytest -q tests
```

Couverture actuelle ajoutee :

- Auth basique et hash mot de passe.
- Refus eleve sur endpoints teacher/admin.
- Admin autorise sur `/admin/users` et groupes.
- Teacher limite a ses groupes.
- Reset mot de passe limite aux eleves des groupes de l'enseignant.
- Ressources filtrees par groupe.
- Bilans eleve filtres cote backend.
- Bilans teacher limites aux eleves autorises.

## Frontend unit

Commande prevue :

```bash
npm install
npm run test:unit
```

Etat au 2026-05-24 : `npm install` a echoue dans le clone courant par timeout reseau sur `registry.npmjs.org/undici-types`. A relancer lorsque le reseau npm est stable.

## E2E Playwright

Commandes prevues :

```bash
npx playwright install chromium
npm run test:e2e
```

Scenarios a maintenir :

- Login eleve et redirection `student.html`.
- Login teacher/admin et redirection `dashboard.html`.
- Affichage groupes, ressources, bilans.
- Reset mot de passe autorise/refuse.
- Gestion propre des `401`, `403`, `404`.
