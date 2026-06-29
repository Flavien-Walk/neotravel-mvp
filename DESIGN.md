# NeoTravel — Système de design

## Direction artistique

NeoTravel est une plateforme B2B de gestion du transport de groupe. Pas un SaaS IA générique.

**Mots-clés visuels** : cockpit commercial · itinéraire · réseau · fiabilité · précision · sérieux · mobilité · confiance B2B

**Opposés à éviter** : startup fun · bulle SaaS · dashboard sombre illisible · illustrations plates corporate

---

## Palette de couleurs

### Landing (dark)
| Token CSS | Hex | Usage |
|-----------|-----|-------|
| `--bg-base` | `#030D20` | Fond principal landing — navy profond |
| `--bg-surface` | `#061435` | Cartes dark |
| `--bg-elevated` | `#0A1C48` | Éléments surélevés |
| `--accent-blue` | `#2563EB` | Action principale, liens actifs |
| `--accent-gold` | `#F59E0B` | CTA principal (btn-gold) |
| `text-gradient-blue` | `#60A5FA → #2563EB → #0EA5E9` | Titres gradient |

**Accents secondaires** (dans les sections) :
- `#60A5FA` — étapes, informations
- `#A78BFA` — qualification, NeoTravel
- `#4ADE80` — succès, envoyé, calculé
- `#38BDF8` — suivi, tracking
- `#FCD34D` — calcul, prix, formule
- `#FB923C` — reprise humaine, avertissement léger
- `#EF4444` — chaos, erreur

### Dashboard (light)
| Token CSS | Hex | Usage |
|-----------|-----|-------|
| `--dash-bg` | `#F8FAFC` | Fond dashboard |
| `--dash-surface` | `#FFFFFF` | Cartes |
| `--dash-border` | `#E2E8F0` | Bordures |
| `--dash-text` | `#0F172A` | Texte principal |
| `--dash-text-muted` | `#64748B` | Labels, sous-titres |
| `--dash-primary` | `#2563EB` | Actions, liens |

---

## Typographie

**Display / Titres** : Inter, `font-bold` ou `font-black`  
Scale : `text-4xl` → `text-5xl` → `text-[3.35rem]` pour les H1  
Leading : `leading-[1.05]` à `leading-[1.1]` pour les grands titres

**Corps** : Inter, `text-sm` à `text-base`, `leading-relaxed`

**Valeurs métier** : `font-mono` — systématiquement pour :
- Prix (ex: `3 840 €`)
- Distances (ex: `284 km`)
- Fonctions code (ex: `calculer_devis()`)
- Statuts machine (ex: `devis_genere`)
- Timestamps

**Eyebrow / Labels** : `.label-tag` — `text-xs font-bold uppercase tracking-widest`

---

## Composants

### Boutons
- `.btn-gold` — CTA principal (fond doré #F59E0B, texte navy) → "Demander un devis"
- `.btn-primary` — action bleue sur fond dark
- `.btn-ghost` — action secondaire sur fond dark
- `.btn-outline` — outline bleu
- `.btn-solid` — action bleue sur fond light

**Règle** : un seul btn-gold par section. Le reste en ghost ou outline.

### Cartes Landing
- `.card-neo` — fond rgba blanc 4%, bordure subtile
- `.card-premium` — gradient léger, hover border bleue
- `.glass` / `.glass-strong` — backdrop blur, pour les éléments flottants

### Cartes Dashboard
- Surface `#FFFFFF`, border `#E2E8F0`, shadow `var(--dash-shadow)`
- Border-top accent coloré pour les KPI
- Border-left colorée pour les action cards

### Badges / Chips
- Statut lead : couleur sémantique (violet=nouveau, bleu=qualifié, orange=en attente, vert=accepté, rouge=reprise)
- Urgence : pill coloré, affiché seulement si non-normal
- Étapes : `label-tag` avec couleur de l'étape

---

## Layout

**Container** : `.container-neo` = `max-w-6xl mx-auto`

**Sections Landing** : `.section-padding` = `py-20 sm:py-28 px-4 sm:px-6`

**Grille** :
- Hero : `lg:grid-cols-2` texte + visual
- Features/Pour qui : `sm:grid-cols-2 lg:grid-cols-3` ou `xl:grid-cols-5`
- Dashboard : `grid-cols-2 sm:grid-cols-4` pour KPIs, `lg:grid-cols-[1fr_280px]` pour main+sidebar

**Séparateurs** :
- `.section-sep` — gradient bleu horizontal
- `.divider` — gradient blanc très subtil

---

## Effets & Motion

**Règle principale** : one orchestrated moment > scattered effects

**Scroll animations** :
- ChaosToPipeline : scroll-driven avec lerp, sticky section (360vh)
- ScrollTimeline : GSAP ScrollTrigger, entrance animations
- Entrances simples : `framer-motion` opacity + translateY(24px), duration 0.55–0.7s

**Fonds dynamiques** :
- `.bg-grid-dark` : grille subtile sur sections navy
- `.bg-noise` : bruit fractal léger sur le hero
- SVG paths animés : routes de transport dans le hero
- Dot matrix pattern : `radial-gradient` 36px

**Performance** :
- `will-change: opacity, transform` uniquement sur les éléments animés
- Lazy loading des bibliothèques d'animation (GSAP importé dynamiquement)
- `prefers-reduced-motion` : désactive tout via `globals.css`

---

## Icônes

**Lucide React** : icônes UI fonctionnelles (navigation, actions, états)  
**Phosphor Icons** (duotone) : icônes métier à forte valeur visuelle

**Règle de cohérence** :
- Ne pas mélanger Lucide + Phosphor dans le même composant card
- Phosphor `weight="duotone"` pour les icônes dans les steps/pipeline
- Lucide pour les boutons, tableaux, formulaires

**Taille** :
- Boutons : `w-4 h-4`
- Cards mini : `w-5 h-5` ou `w-6 h-6`
- Icônes illustratives : `w-10 h-10` dans un container `w-12 h-12`

---

## Images & Assets

**Photos locales uniquement** (dans `/public/images/neotravel/`) :
- `bus-hero.jpg` — Hero section background
- `bus-road.jpg` — Routes, déplacements, contexte
- `bus-commercial.jpg` — Entreprises, séminaires
- `bus-faq.jpg` — FAQ section background
- `bus-cta.jpg` — FinalCTA background
- `bus-group.jpg` — Groupes, associations
- `bus-client.jpg` — Espace client
- `group-travel.jpg` — Voyages scolaires, groupes

**Interdictions** :
- Zéro hotlink externe (Unsplash, Pexels, Picsum)
- Zéro illustration "personnage corporate"
- Zéro icône flaticon ou clipart

**Traitement photo** :
- Overlay navy gradient sur les photos de fond (lisibilité texte)
- `object-cover object-center` systématique
- `next/image` avec `sizes` prop pour performance

---

## Dashboard — Règles spécifiques

**Philosophie** : cockpit commercial, pas tableau de bord startup

**KPI cards** :
- Border-top accent coloré (3px) = signal visuel immédiat
- Valeur numérique bold 2xl, label xs en dessous
- Icône dans container coloré translucide

**Pipeline** :
- Bulles numérotées avec couleur sémantique par statut
- Vide = gris, rempli = couleur du statut
- Progression visible gauche → droite

**Leads table** :
- Hover: `onMouseEnter/Leave` avec `var(--dash-muted)` background
- Action "Ouvrir" visible au hover seulement (`opacity-0 group-hover:opacity-100`)

**Urgents** :
- Panel droit avec border amber
- Toujours visible si > 0 urgents
- Link direct vers le lead

**Reprise humaine** :
- Red badge, action card en priorité
- Jamais silencieux — toujours affiché

---

## Landing — Règles spécifiques

**Hero** :
- Photo bus en background, overlay navy
- SVG route paths animés
- Texte blanc, CTA gold visible dès le premier scroll

**Sections alternées** :
- Dark sections : `#071B3E` ↔ `#030D20` alternés
- Jamais deux sections au même background exact
- Section separators `.section-sep` entre dark et light

**CTA** :
- Un seul `btn-gold` par section
- Toujours accompagné de social proof ("Gratuit · Sans engagement · < 2h")
- CTA secondaire en ghost ou outline

**Message** :
1. NeoTravel aide à demander un devis de transport de groupe
2. L'agent IA collecte les infos
3. **Le code calcule** — `calculer_devis()`, pas l'IA
4. Le commercial garde la main
5. Le client suit sa demande

---

## Anti-patterns NeoTravel

| ❌ Interdit | ✓ Alternative |
|-------------|---------------|
| "IA qui calcule le prix" | "Moteur métier déterministe `calculer_devis()`" |
| Fond crème warm | Navy `#030D20` ou blanc `#F8FAFC` |
| Glassmorphism partout | Glass uniquement pour éléments flottants |
| Animations partout | 1 animation orchestrée par section max |
| Icônes sans contexte | Icônes dans container coloré avec label |
| Texte IA-washing | Texte précis : "calcul", "traçable", "règles métier" |
| Hotlinks externes | Assets locaux dans `/public/images/neotravel/` |
| Design sombre illisible | Dashboard light par défaut, dark opt-in |
