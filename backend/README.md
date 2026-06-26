# NeoTravel — Backend (branche `backend`)

> API REST Node.js / Express / TypeScript avec MongoDB.

## Règle métier fondamentale

> **"L'agent collecte et orchestre, le code calcule."**

La fonction `calculer_devis()` dans `src/services/calculer_devis.ts` est **entièrement déterministe**.
Elle ne dépend d'aucun LLM. Mêmes entrées → mêmes sorties. Toujours.

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Langage | TypeScript 5 |
| Base de données | MongoDB + Mongoose |
| Déploiement | Render (branche `backend`) |

---

## Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/health` | Statut de l'API |
| POST | `/api/leads` | Créer un lead |
| GET | `/api/leads` | Lister les leads (filtre `?statut=xxx`) |
| GET | `/api/leads/:id` | Détail d'un lead (avec devis) |
| PATCH | `/api/leads/:id/status` | Changer le statut |
| POST | `/api/quotes/calculate` | Calculer un devis |
| POST | `/api/logs` | Créer un log |
| GET | `/api/logs` | Lister les logs (filtre `?leadId=xxx`) |

---

## Installation locale

```bash
# Récupérer la branche backend
git clone -b backend https://github.com/VOTRE_USERNAME/neotravel-mvp.git neotravel-backend
cd neotravel-backend

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env

# Éditer .env avec votre MONGODB_URI
# Vous pouvez utiliser MongoDB Atlas (gratuit) : https://cloud.mongodb.com

# Lancer en développement (hot reload)
npm run dev
```

Tester : [http://localhost:4000/health](http://localhost:4000/health)

---

## Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `MONGODB_URI` | URI de connexion MongoDB Atlas | Oui |
| `PORT` | Port d'écoute | Non (défaut: 4000) |
| `ADMIN_SECRET` | Secret admin dashboard | Non |
| `NODE_ENV` | `development` ou `production` | Non |

---

## Déploiement Render

1. Connecter le repo GitHub à Render
2. New Web Service → branche `backend`
3. Build command : `npm install && npm run build`
4. Start command : `npm start`
5. Ajouter les variables d'environnement dans le dashboard Render
6. Deploy

Le fichier `render.yaml` est pré-configuré.

---

## Fonction calculer_devis()

Fichier : `src/services/calculer_devis.ts`

```typescript
import { calculer_devis } from './services/calculer_devis'

const result = calculer_devis({
  depart: 'Paris',
  destination: 'Lyon',
  date_depart: '2024-09-15',
  nb_passagers: 45,
  type_trajet: 'aller_retour',
  urgence: 'normal',
  options: ['wifi'],
})
// → { success: true, prix_ht: 2222.50, tva: 222.25, prix_ttc: 2444.75, ... }
```

### Trajets disponibles (table mockée)

Paris ↔ Lyon, Marseille, Bordeaux, Toulouse, Lille, Nantes, Strasbourg, Rennes, Nice
Lyon ↔ Marseille, Bordeaux, Toulouse, Lille, Nice
Marseille ↔ Toulouse, Bordeaux, Nice
Bordeaux ↔ Toulouse, Nantes
Toulouse ↔ Nice
Lille ↔ Rennes
Nantes ↔ Rennes
Strasbourg ↔ Lyon

Pour tout autre trajet → `needs_human_review: true`

### Cas d'erreur gérés

| Cas | Message retourné |
|-----|-----------------|
| Passagers manquants | `Nombre de passagers manquant.` |
| Passagers = 0 | `Le nombre de passagers ne peut pas être 0.` |
| Passagers > 85 | `X passagers dépasse la capacité maximale (85).` |
| Date retour < date départ | `La date de retour est antérieure à la date de départ.` |
| Ville manquante | `Ville de départ/destination manquante.` |
| Trajet inconnu | `Trajet hors zone → needs_human_review: true` |

---

## Statuts du pipeline

```
nouveau → incomplet → qualifie → devis_genere → devis_envoye
                                                       ↓
                                              relance_1 → relance_2
                                                       ↓
                                    accepte / refuse / cloture / cas_complexe
```

---

## Architecture backend

```
src/
├── index.ts              # Point d'entrée Express
├── config/
│   └── database.ts       # Connexion Mongoose
├── models/
│   ├── Lead.ts           # Modèle MongoDB + calcul score_completude
│   ├── Quote.ts          # Modèle devis
│   └── Log.ts            # Modèle logs
├── routes/
│   ├── leads.ts          # CRUD leads
│   ├── quotes.ts         # Calcul et sauvegarde devis
│   └── logs.ts           # Logs
├── services/
│   └── calculer_devis.ts # Fonction déterministe — JAMAIS de LLM
└── middleware/
    └── auth.ts           # Protection admin basique
```

---

## Limites du MVP

- Auth = simple header secret (pas de JWT)
- Emails = simulation log (pas d'envoi réel — intégrer Resend en V2)
- Distances = table mockée 20 trajets (intégrer Google Maps Directions API en V2)
- Tarifs = hypothèses [MOCK MVP] non contractuelles
- Pas de webhook Stripe (en V2)
