# NeoTravel — Règles projet OBLIGATOIRES

## Workflow de travail (ordre impératif)

Avant toute modification significative :

1. **Analyser** → `graphify query` ou `graphify explain` avant de lire 10+ fichiers
2. **Planifier** → décomposer en tâches atomiques (skill superpowers)
3. **Designer** → consulter `DESIGN.md` avant toute modification UI (skill frontend-design)
4. **Sécuriser** → vérifier les règles de la skill security avant auth/API/LLM
5. **Implémenter** → une tâche à la fois, tests inclus
6. **Vérifier** → build + tests + review sécurité
7. **Réviser** → lister les fichiers modifiés précisément

Ne jamais faire un "j'ai terminé" sans avoir lancé `npm run build`.

## Règle métier absolue

> **L'agent collecte et orchestre. `calculer_devis()` calcule.**
>
> Claude ne génère jamais un prix. Ne remplace jamais `calculer_devis()`. Ne valide jamais un devis commercialement.

## Règles de sécurité absolues

- NEVER committer `.env` ou `.env.local`
- NEVER exposer `MONGODB_URI`, `ANTHROPIC_API_KEY`, `ADMIN_SECRET` côté client
- NEVER utiliser `NEXT_PUBLIC_` pour des secrets
- Si un secret apparaît dans un fichier tracké → STOP et corriger avant tout push
- Branche `main` = frontend Next.js · branche `backend` = Express/MongoDB

## Référence design

- `DESIGN.md` — système visuel complet NeoTravel (palette, typo, composants, règles)
- Toujours utiliser les assets locaux `/public/images/neotravel/` — zéro hotlink externe

## Skills disponibles

| Skill | Trigger | Utiliser quand |
|-------|---------|----------------|
| graphify | `/graphify` | Avant toute analyse d'architecture |
| superpowers | `.claude/skills/superpowers/SKILL.md` | Avant toute grosse modification |
| frontend-design | `.claude/skills/frontend-design/SKILL.md` | Avant toute modification UI/design |
| security | `.claude/skills/security/SKILL.md` | Avant toute modification auth/API/LLM |
| code-review | `/code-review` | Après toute modification significative |

## Ne jamais produire

- Design générique (SaaS random, startup template)
- Modification à l'aveugle sans avoir lu le code existant
- Assets hotlinkés externes
- Prix ou règle tarifaire calculée par Claude

---

## graphify

This project has a knowledge graph at graphify-out/ (367 nodes, 497 edges, 23 communities).

### Règles d'utilisation — OBLIGATOIRES

Avant toute analyse large du projet NeoTravel, utilise d'abord Graphify.

- Utilise `graphify query "<question>"` pour comprendre l'architecture ou localiser du code.
- Utilise `graphify explain "<concept>"` pour expliquer un service, composant ou fonction.
- Utilise `graphify path "<A>" "<B>"` pour comprendre le lien entre deux éléments.
- Ne lis pas 20 fichiers à la suite si une requête Graphify suffit.
- Ne fais pas de grep global inutile avant d'avoir interrogé le graphe.
- Lis les fichiers source uniquement après avoir identifié les bons fichiers via Graphify.
- Après avoir modifié du code, lance `graphify update .` pour maintenir le graphe à jour (AST uniquement, sans coût API).

### Exemples de requêtes

```
graphify query "comment fonctionne le parcours de devis NeoTravel ?"
graphify query "où est utilisé calculer_devis ?"
graphify query "comment l'agent IA est connecté au devis ?"
graphify explain "calculer_devis"
graphify explain "DevisTabSwitcher"
graphify path "AIAssistantChat" "api"
```

### Référence rapide

- `graphify-out/GRAPH_REPORT.md` — rapport d'architecture complet (utiliser uniquement pour revue globale)
- `graphify-out/graph.json` — graphe brut (367 nœuds, 497 arêtes)
- `graphify-out/graph.html` — visualisation interactive

### Règle de sécurité

Ne jamais indexer les secrets, clés API ou variables d'environnement sensibles (.env, .env.local).
