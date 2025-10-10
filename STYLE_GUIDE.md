# STYLE_GUIDE – Interface Maths 2025–2026

## 1. Design tokens (source de vérité)
- **Couleurs (Tailwind theme.extend.colors)**
  - `primary: #1E3A8A` (bleu PMF)
  - `primary-600: #1D4ED8`
  - `secondary: #059669` (vert validation)
  - `accent: #F59E0B` (accent pédagogique)
  - `muted: #6B7280` (texte secondaire)
  - `bg: #F7FAFC` (fond clair)
  - `surface: #FFFFFF` (cartes/blocs)
  - **État**
    - `success: #10B981`, `warning: #F59E0B`, `danger: #EF4444`, `info: #3B82F6`

- **Typographies**
  - Texte courant: `Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu`
  - Titres: même famille, poids `600/700`
  - Échelle: `text-sm, base, lg, xl, 2xl, 3xl` (pas d’échelles arbitraires)

- **Espacements**
  - Unités Tailwind exclusivement (`2, 3, 4, 6, 8, 10`)
  - Grilles: `grid gap-6` par défaut dans les pages

- **Rayons & ombres**
  - `rounded-2xl` pour cartes, `shadow-md`/`shadow-lg` (pas de box-shadow custom CSS)

## 2. Composants (extraits, classes obligatoires)
- **Card**
  - `bg-surface rounded-2xl shadow-md p-6`
  - Variantes: `border border-gray-100` si dense

- **Titre de page**
  - `text-3xl font-bold text-primary mb-6`

- **Section titre**
  - `text-xl font-semibold text-primary-600 mb-3`

- **Bouton primaire**
  - `inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary/30`

- **Badge**
  - `inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-accent/10 text-accent`

- **Alertes**
  - `rounded-xl p-4` + couleur d’état (`bg-success/10 text-success`, etc.)

- **Tableaux**
  - `w-full text-sm`
  - En-têtes: `bg-gray-50 text-muted font-semibold`
  - Lignes zébrées: `odd:bg-white even:bg-gray-50`

## 3. Pages pédagogiques (obligations)
- **Cours**: en-tête avec titre, niveau, thème, compétences clés (badges).
- **Fiches mémo**: cartes par concept, exemples minimalistes, encadrés « À retenir ».
- **Fiches élèves**: tableau synthèse + cartes de progression; contraste AA.
- **Navigation**: fil d’Ariane (niveau → chapitre → item), état actif visible.

## 4. Tailwind
- Fichier: `tailwind.config.ts`
- `content` doit couvrir `site/**/*.{html,ts,tsx,js}`
- `theme.extend.colors` = tokens ci-dessus — **interdiction** d’utiliser des hex arbitraires en composants.

## 5. Do / Don’t
- ✅ Utiliser **uniquement** classes Tailwind et tokens.
- ✅ Facteur commun → composant dans `site/components/`.
- ❌ Pas de style inline, pas d’hex hors palette, pas de marges « magiques ».
- ❌ Pas d’icônes bitmap floues; privilégier SVG.

## 6. Accessibilité
- Focus visible (`focus:ring-2 focus:ring-primary/30`)
- `aria-label` explicites sur boutons/liaisons icônes
- Contraste texte/fond ≥ **AA**
