# UI Regression Checklist – Interface Maths 2025–2026

## A. Tailwind & build

- [ ] `tailwind.config.ts` : `content` couvre toutes les pages/components
- [ ] `theme.extend.colors` = tokens de `STYLE_GUIDE.md`
- [ ] PostCSS (autoprefixer) actif ; build Vite passe sans warning
- [ ] Aucun style inline / `!important` dans le code

## B. Composants communs

- [ ] Card, Titre, Bouton, Badge, Alerte, Table respectent strictement les classes spécifiées
- [ ] Variantes d’état (success/warning/danger/info) conformes

## C. Pages clés

- [ ] **Cours** : titres, badges compétences, structure sections OK
- [ ] **Fiches mémo** : grilles régulières, encadrés « À retenir »
- [ ] **Fiches élèves** : tableau + cartes progression ; lisibilité mobile
- [ ] Éléments interactifs avec focus visible & aria-label

## D. Routage & navigation

- [ ] Routes Cours/Fiches/Élèves chargent sans 404
- [ ] Breadcrumbs cohérents (niveau → chapitre → item)
- [ ] État actif du menu clairement visible

## E. Performance & accessibilité

- [ ] Lighthouse Accessibilité ≥ 95, Performance ≥ 85
- [ ] Bundle JS ≤ 250 KB, CSS ≤ 120 KB (par page)
- [ ] Images responsive (srcset) ou SVG ; pas d’assets > 300 KB

## F. Non-régression visuelle

- [ ] Tests visuels Playwright avec snapshots approuvés
- [ ] Diff ≤ 0.1% sur pages clés
