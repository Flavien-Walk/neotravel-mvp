# Security Skill — NeoTravel

## Checklist de sécurité obligatoire

À utiliser avant tout commit touchant : auth, routes API, middleware, variables d'env, LLM.

### Secrets & Variables d'environnement

- [ ] `.env` et `.env.local` sont dans `.gitignore` → **vérifier avec `git check-ignore .env`**
- [ ] Aucune clé API dans le code source ou les fichiers committés
- [ ] `ANTHROPIC_API_KEY` : côté serveur uniquement — jamais `NEXT_PUBLIC_ANTHROPIC_API_KEY`
- [ ] `MONGODB_URI` : côté serveur uniquement — jamais exposé au client
- [ ] `NEXT_PUBLIC_*` : uniquement pour des valeurs vraiment publiques (URL API, etc.)
- [ ] `.env.example` : ne contient que des placeholders, jamais de vraies valeurs

### Routes API Next.js (`src/app/api/`)

- [ ] Les routes qui lisent des données sensibles vérifient l'authentification
- [ ] Pas de données personnelles retournées sans vérification de rôle
- [ ] `process.env.ANTHROPIC_API_KEY` utilisé côté serveur uniquement
- [ ] Validation des inputs utilisateur (longueur, format, type)
- [ ] Gestion des erreurs sans leak de stack trace en production

### Auth & Rôles

- [ ] Dashboard commercial `/dashboard` : accès réservé aux commerciaux/admins
- [ ] Espace client `/client` : accès limité aux données du client connecté
- [ ] Routes `/admin` : accès admin uniquement
- [ ] Middleware de protection actif pour toutes les routes protégées
- [ ] Tokens JWT ou session validés côté serveur

### LLM & Agent IA

- [ ] L'agent IA ne génère jamais un prix — `calculer_devis()` calcule
- [ ] Les prompts ne contiennent pas de données personnelles inutiles
- [ ] Les réponses LLM sont validées (Zod) avant utilisation
- [ ] Logs de l'agent : pas de données personnelles (email, téléphone)
- [ ] Protection contre prompt injection dans les inputs utilisateur

### Frontend

- [ ] XSS : pas de `dangerouslySetInnerHTML` sans sanitisation
- [ ] URLs de redirection validées (pas de open redirect)
- [ ] Pas de clés API dans le bundle client (`typeof window !== 'undefined'` check)
- [ ] `Content-Security-Policy` si en production

### RGPD de base

- [ ] Données personnelles (nom, email, téléphone) : collectées uniquement si nécessaire
- [ ] Logs sans données personnelles identifiables
- [ ] Possibilité de suppression d'un lead (fonctionnelle dans le dashboard)

## Commandes de vérification

```bash
# Vérifier .env non tracké
git check-ignore -v .env

# Chercher des clés API hardcodées
grep -r "sk-ant-\|mongodb+srv\|password\s*=" src/ --include="*.ts" --include="*.tsx"

# Vérifier NEXT_PUBLIC_ (tout ce qui est là est public)
grep -r "NEXT_PUBLIC_" src/ --include="*.ts" --include="*.tsx"

# Vérifier les routes non protégées
ls src/app/dashboard/ src/app/admin/ src/app/client/
```

## Risques spécifiques NeoTravel

1. **MongoDB URI** : dans `.env`, jamais committée → OK vérifié
2. **Anthropic API Key** : dans `.env.local`, côté serveur → à vérifier en prod
3. **Admin Secret** : `ADMIN_SECRET` dans `.env` — vérifier usage et rotation
4. **Données clients** : noms, emails dans les leads → accès dashboard seulement
5. **Prompt injection** : l'agent IA reçoit des textes libres → validation Zod active
