# Contribuer à Interface Maths

## Conventions de Commit
Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/).
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage, point-virgules manquants, etc. (sans changement de logique)
- `refactor:` Refactoring de code
- `perf:` Amélioration des performances
- `test:` Ajout de tests
- `chore:` Mise à jour des dépendances, tâches de build

## Développement local

1. **Backend**
```bash
cd apps/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

2. **Frontend**
```bash
cd site
npm install
npm run dev
```

## Procédure de Pull Request
1. Créez une branche (`git checkout -b feat/ma-fonctionnalite`)
2. Commitez vos changements (`git commit -m "feat: ajout de X"`)
3. Poussez la branche (`git push origin feat/ma-fonctionnalite`)
4. Ouvrez une Pull Request sur GitHub.
