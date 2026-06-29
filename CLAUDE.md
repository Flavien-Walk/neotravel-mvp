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
