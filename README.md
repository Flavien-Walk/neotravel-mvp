# NeoTravel — Frontend (branche `main`)

> Plateforme d'intermédiation spécialisée dans le transport de groupe.

## Règle métier fondamentale

> **"L'agent collecte et orchestre, le code calcule."**

Le chatbot collecte les informations du client et structure la demande. Il appelle ensuite `calculer_devis()`, une fonction déterministe côté backend. Le prix n'est **jamais** calculé par une IA ou un LLM — uniquement par du code auditable.

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript |
| Style | Tailwind CSS |
| Déploiement | Vercel (branche `main`) |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page client |
| `/devis` | Chatbot conversationnel guidé |
| `/merci` | Confirmation de demande reçue |
| `/admin` | Dashboard admin (liste des leads) |
| `/admin/leads/[id]` | Détail d'un lead avec devis et logs |

---

## Installation locale

```bash
# Cloner le dépôt (branche main)
git clone https://github.com/VOTRE_USERNAME/neotravel-mvp.git
cd neotravel-mvp

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env.local

# Éditer .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000

# Lancer en développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL de l'API backend | `http://localhost:4000` |

En production Vercel : ajouter dans les *Environment Variables* du projet.

---

## Déploiement Vercel

1. Connecter le repo GitHub à Vercel
2. Branch : `main`
3. Framework preset : `Next.js`
4. Ajouter la variable `NEXT_PUBLIC_API_URL=https://votre-backend.onrender.com`
5. Deploy

---

## Architecture frontend

```
src/
├── app/
│   ├── layout.tsx          # Layout global, métadonnées
│   ├── page.tsx            # Landing page
│   ├── devis/page.tsx      # Page chatbot
│   ├── merci/page.tsx      # Confirmation
│   └── admin/
│       ├── page.tsx        # Dashboard
│       └── leads/[id]/page.tsx  # Détail lead
├── components/
│   ├── ChatBot.tsx         # Interface conversationnelle guidée
│   ├── StatusBadge.tsx     # Badge statut coloré
│   └── UrgencyBadge.tsx    # Badge urgence coloré
├── lib/
│   └── api.ts              # Client HTTP vers le backend
└── types/
    └── index.ts            # Types TypeScript partagés
```

---

## Scénarios de démonstration

### Parcours client complet
1. Aller sur `/devis`
2. Répondre aux 13 questions du chatbot
3. Valider le résumé → redirection `/merci`
4. Aller sur `/admin` → voir le lead apparaître

### Dashboard admin
1. Aller sur `/admin`
2. Cliquer sur "Voir" pour un lead
3. Cliquer "Calculer le devis" → devis généré instantanément
4. Cliquer "Envoyer le devis" → simulation d'envoi email
5. Cliquer "Simuler une relance" → statut passe Relance 1 / 2
6. Cliquer "Reprendre humainement" → statut "Cas complexe"

---

## Limites du MVP

- Auth admin = none (pas de login) — à ajouter en V2
- Emails = simulation (console/log) — intégrer Resend en V2
- API Maps = table de distances mockée — intégrer Google Maps en V2
- IA = logique conversationnelle guidée, pas de LLM
- Signature électronique = non implémentée

---

## Lien backend

Le backend est dans la **branche `backend`** du même dépôt.
Voir le README de cette branche pour l'installation et le déploiement Render.
