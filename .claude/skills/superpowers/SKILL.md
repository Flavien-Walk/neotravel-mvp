# Superpowers — Workflow NeoTravel

## Méthodologie

Superpowers impose une discipline de travail en 5 phases. Ne jamais passer à la phase suivante sans avoir terminé la précédente.

### Phase 1 — Brainstorm
Avant toute implémentation :
- Identifier le vrai besoin (pas juste ce qui est dit)
- Lister les options possibles
- Choisir l'approche avec le meilleur ratio qualité/risque
- Aligner avec le brief NeoTravel

### Phase 2 — Plan
Décomposer en tâches atomiques :
- Chaque tâche = 1 fichier ou 1 fonction
- Estimer les dépendances
- Identifier les risques
- Documenter dans la conversation (ou un plan)

### Phase 3 — Implémentation
- TDD : écrire le test avant le code (si applicable)
- Une tâche à la fois
- Code review entre chaque sous-agent si parallèle
- Jamais de `--no-verify` ou contournement de hooks

### Phase 4 — Vérification
OBLIGATOIRE avant de déclarer "terminé" :
- `npm run build` → 0 erreur
- Tests → 0 failure
- Lint → 0 warning bloquant
- Vérifier visuellement (dev server si UI)
- Vérifier sécurité (secrets, routes protégées)

### Phase 5 — Review
- Relire les fichiers modifiés
- Chercher les régressions
- Vérifier la cohérence CLAUDE.md
- Lister précisément ce qui a changé

## Anti-patterns à éviter

- "J'ai terminé" sans avoir lancé le build
- Modifier 15 fichiers d'un coup sans plan
- Estimer un prix ou générer une règle métier (→ `calculer_devis()`)
- Committer `.env` ou secrets
- Ignorer les tests existants

## Règle NeoTravel

> L'agent collecte et orchestre. `calculer_devis()` calcule.
> Claude ne génère jamais un prix, ne remplace pas la logique métier.

## Installation officielle

```
/plugin install superpowers@claude-plugins-official
```
ou
```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```
