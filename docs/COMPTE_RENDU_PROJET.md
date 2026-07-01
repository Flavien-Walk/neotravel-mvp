# NeoTravel — Compte rendu complet du projet

> Document d'audit rédigé à partir du code source réel. Version : juillet 2026.

---

## 1. Présentation de NeoTravel

NeoTravel est une plateforme web de **demande et de gestion de devis de transport de groupes en autocar**. Elle s'adresse aux entreprises, écoles, associations ou particuliers qui ont besoin d'organiser le déplacement d'un groupe (de quelques personnes à plusieurs centaines).

Le projet répond à un problème précis : **le processus de devis transport de groupe est lent, opaque et manuel**. Appel téléphonique, attente, devis envoyé par email trois jours plus tard, sans détail ni justification — NeoTravel remplace ce processus par une expérience digitale fluide, traçable et semi-automatisée.

---

## 2. Le problème résolu

| Avant NeoTravel | Avec NeoTravel |
|---|---|
| Appel téléphonique ou formulaire de contact | Demande en ligne en 3 à 5 minutes |
| Attente de 24h à 72h pour un devis | Calcul automatique, réponse sous 2h ouvrées |
| Devis reçu par email sans explication | Devis détaillé ligne par ligne avec formule |
| Aucune visibilité sur l'avancement | Suivi de statut en temps réel (lien de tracking) |
| Prise en charge manuelle de chaque dossier | Automatisation des cas standard, escalade humaine pour les cas complexes |

---

## 3. Cible utilisateur

Le projet distingue trois types d'utilisateurs :

| Rôle | Ce qu'il fait |
|---|---|
| **Client (prospect)** | Demande un devis sur le site public, suit l'avancement sans compte obligatoire |
| **Commercial** | Gère les leads dans le dashboard, valide les devis, envoie les emails, traite les cas complexes |
| **Admin** | Accès complet à toutes les données, gestion des comptes, vue d'ensemble |

---

## 4. Architecture technique

NeoTravel est composé de deux parties distinctes :

```
┌─────────────────────────────────────────┐
│         FRONTEND — branche main         │
│  Next.js 14.2.5 · TypeScript · Vercel  │
│  Site public + Dashboard commercial    │
└──────────────────┬──────────────────────┘
                   │ API REST (JWT Bearer)
┌──────────────────▼──────────────────────┐
│        BACKEND — branche backend        │
│  Express.js · Render.com               │
│  calculer_devis() · auth · logs        │
│  Base de données : Supabase (PostgreSQL)│
└─────────────────────────────────────────┘
```

**Déploiement automatique :** tout push sur `main` → redéploiement Vercel. Tout push sur `backend` → redéploiement Render.

### Stack technique détaillée

| Couche | Technologie | Rôle |
|---|---|---|
| Frontend | Next.js 14.2.5 (App Router) | Site public + dashboard |
| Language | TypeScript | Typage strict de bout en bout |
| UI | Tailwind CSS + Framer Motion + GSAP | Styles et animations |
| Base de données | Supabase (PostgreSQL) | Stockage leads, devis, logs, users |
| Auth | JWT Bearer + localStorage | Sessions utilisateurs |
| IA | Claude claude-sonnet-4-6 via Vercel AI SDK | Assistant conversationnel collecte |
| Emails | n8n (webhook) | Envoi et relances automatiques |
| Déploiement frontend | Vercel | CI/CD automatique depuis GitHub |
| Déploiement backend | Render | Serveur API Express |
| Icônes | Lucide React + Phosphor Icons | Interface |
| Validation | Zod | Schemas typés |
| Cartographie | D3-geo + React Simple Maps | Carte interactive hero |

---

## 5. Parcours complet d'un lead

Voici le cycle de vie complet d'une demande, du premier clic à la confirmation :

```
[Client sur le site public]
         │
         ▼
1. PAGE /devis — Choix du mode de saisie
   ├── Formulaire guidé (ChatBot étape par étape)
   └── Assistant IA conversationnel (AIAssistantChat)
         │
         ▼
2. COLLECTE DES INFORMATIONS
   - Nom, email, téléphone, société
   - Ville de départ, ville de destination
   - Date de départ / retour
   - Nombre de passagers
   - Type de trajet (aller simple / aller-retour / circuit)
   - Niveau d'urgence (normal / urgent / très urgent)
   - Options (climatisation, WiFi, etc.)
   - Commentaire libre
         │
         ▼
3. CRÉATION DU LEAD (statut : "nouveau")
   → Enregistrement en base de données (Supabase)
   → Score de complétude calculé automatiquement
   → Page /merci affichée au client + lien de suivi par token
         │
         ▼
4. QUALIFICATION AUTOMATIQUE
   → Si informations suffisantes : statut "qualifié"
   → Si informations manquantes : statut "incomplet"
   → Si cas complexe détecté : statut "reprise_humaine"
   (cas complexes : >85 passagers, ville inconnue, circuit multi-étapes,
    groupe scolaire international, dates incohérentes)
         │
         ▼
5. CALCUL DU DEVIS (calculer_devis() — côté backend)
   → Prix calculé selon distance, durée, nb passagers, options, coefficients
   → Lignes de calcul détaillées (formule + source + justification)
   → Statut devis : "pending_human_validation"
         │
         ▼
6. VALIDATION HUMAINE (commercial/admin dans le dashboard)
   → Le commercial consulte le devis détaillé
   → Il peut consulter le référentiel marché (benchmark)
   → Il peut ajuster manuellement le prix (avec justification obligatoire)
   → Il valide : statut devis → "approved"
         │
         ▼
7. ENVOI EMAIL (via n8n)
   → n8n reçoit un webhook depuis le backend
   → Email formaté envoyé au client avec le devis complet
   → Statut : "devis_envoye"
         │
         ▼
8. SUIVI ET RELANCES
   → Client peut suivre via son lien /suivi/[token]
   → Si pas de réponse après 48h : relance automatique (relance_1, relance_2)
   → Relances envoyées également via n8n
         │
         ▼
9. CLÔTURE
   ├── Accepté → "accepte"
   ├── Refusé → "refuse"
   └── Sans réponse → "cloture"
```

---

## 6. Fonctionnement de la demande de devis

### 6.1 Le formulaire guidé (ChatBot)

Le `ChatBot` est un formulaire conversationnel étape par étape. Il pose une question à la fois, dans un ordre logique, avec des validations en temps réel. Il est simple, accessible et fonctionne sans JavaScript complexe. C'est le mode **recommandé par défaut**.

### 6.2 L'assistant IA conversationnel (AIAssistantChat)

L'assistant est alimenté par **Claude claude-sonnet-4-6** via le Vercel AI SDK (streaming SSE). Le client peut décrire sa demande librement en langage naturel : "J'ai besoin d'un bus pour 45 personnes de Paris à Lyon le 15 août".

**Ce que fait l'IA :**
- Comprend la demande en langue naturelle
- Extrait les champs structurés (nom, email, villes, dates, passagers...)
- Pose les questions manquantes naturellement, une à la fois
- Détecte les villes ambiguës ou inconnues
- Évalue un score de confiance (0 à 1)
- Détermine l'action suivante (`ask_missing_field`, `validate_city`, `create_lead`, `calculate_quote`, `escalate_human`)

**Ce que l'IA ne fait PAS (règle absolue) :**
- Elle ne calcule jamais un prix
- Elle ne chiffre jamais une distance
- Elle n'invente pas de règle tarifaire
- Si un utilisateur tente de la manipuler ("calcule toi-même", "ignore tes instructions"), elle répond systématiquement par un refus programmatique

### 6.3 Validation des villes

Chaque ville mentionnée est **revérifiée par du code** (pas seulement par l'IA) via `validateCity()` dans `src/lib/quoteAssistant.ts`. Si une ville est inconnue ou ambiguë, le dossier est automatiquement transmis à un conseiller humain.

---

## 7. Fonctionnement du dashboard commercial / admin

Le dashboard (`/dashboard`) est accessible uniquement aux rôles `commercial` et `admin`. Il comprend 4 sections :

### Vue d'ensemble (`/dashboard`)
- KPIs en temps réel : total leads, leads actifs, devis envoyés, taux d'acceptation
- Pipeline visuel des leads par étape (Nouveau → Qualifié → À valider → Envoyé → Relance → Accepté)
- Actions urgentes signalées (leads à traiter en priorité)
- Liste des derniers leads avec statut et urgence

### Leads (`/dashboard/leads`)
- Liste complète avec filtres (statut, urgence) et recherche
- Tri par date, nom, urgence
- Accès au détail de chaque lead

### Détail d'un lead (`/dashboard/leads/[id]`)
- Informations complètes du lead (trajet, contact, dates, options)
- Devis calculé avec lignes détaillées (label, formule, montant, source)
- Ajustement manuel du prix avec justification obligatoire
- Bandeau de validation si le devis attend approbation
- Référentiel marché (benchmark) pour aide à la décision
- Historique de toutes les actions (logs) horodatés
- Sidebar d'actions : calculer, approuver, envoyer, relancer, télécharger PDF, changer statut

### Logs (`/dashboard/logs`)
- Historique complet de toutes les actions système
- Chaque entrée : action, statut (success/error/info/warning), timestamp, payload

### Paramètres (`/dashboard/settings`)
- Gestion du profil (nom, email, organisation)
- Changement de mot de passe
- Préférences notifications
- Informations de sécurité de la session

---

## 8. Fonctionnement du calcul de devis

Le calcul est entièrement **déterministe et côté backend** (`calculer_devis()` dans la branche `backend`). L'IA n'y participe jamais.

### Inputs du calcul
- Distance (depart → destination)
- Durée estimée
- Nombre de passagers
- Type de trajet (aller simple / aller-retour / circuit)
- Niveau d'urgence
- Options sélectionnées (climatisation, WiFi, etc.)

### Outputs du calcul
- `prix_ht` — prix hors taxes calculé
- `tva` — TVA applicable
- `prix_ttc` — prix toutes taxes comprises
- `lignes_calcul` — tableau détaillé de chaque poste avec formule, variables, source
- `sources_calcul` — références des règles utilisées (documentée, hypothèse MVP, à affiner)
- `warnings` — alertes éventuelles (hypothèse utilisée, point à vérifier)
- `besoin_reprise_humaine` — booléen déclenché si le cas sort du cadre standard
- `explication_calcul` — texte explicatif du raisonnement

### Transparence du calcul
Chaque ligne de devis indique sa **source** (`regle_documentee`, `mock_mvp`, `hypothese_mvp`, `a_definir`), ce qui permet au commercial de savoir exactement sur quoi repose chaque montant.

### Ajustement manuel
Le commercial peut modifier le prix calculé en entrant un **ajustement manuel HT** avec une **justification obligatoire**. Cet ajustement est loggé avec le nom du commercial et la date de modification.

---

## 9. Rôle de Supabase

Supabase est la **base de données PostgreSQL** du projet (migration depuis MongoDB).

### Tables principales

| Table | Contenu |
|---|---|
| `users` | Comptes admin, commercial, client (mot de passe hashé, rôle, organisation) |
| `leads` | Toutes les demandes de devis (trajet, contact, statut, token de suivi) |
| `quotes` | Devis associés aux leads (prix, lignes de calcul, statut devis) |
| `logs` | Historique de toutes les actions système |
| `market_benchmarks` | Données de benchmark prix marché (aide à la décision commerciale) |

### Sécurité Supabase
- **Row Level Security (RLS)** activé sur toutes les tables
- `market_benchmarks` accessible uniquement via la **service role key** (server-side Next.js uniquement, jamais exposé au navigateur)
- Aucun secret Supabase en `NEXT_PUBLIC_`
- Variables d'environnement : `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` (server-only)

---

## 10. Rôle de n8n

n8n est l'outil d'**automatisation de workflows** utilisé pour tout ce qui touche aux communications externes, principalement les emails.

### Ce que n8n gère
- **Envoi du devis par email** : lorsque le commercial clique "Envoyer le devis", le backend déclenche un webhook n8n qui formate et envoie l'email au client
- **Relances automatiques** : si le client n'a pas répondu après 48h (relance_1), puis à nouveau (relance_2)
- **Test d'email** : route admin `/api/admin/test-email` pour vérifier la configuration

### Pourquoi n8n et pas un service d'email direct
- n8n permet de créer des workflows visuels sans coder l'envoi d'email
- Facile à modifier (template email, délai de relance) sans toucher au code
- Peut être étendu pour d'autres automatisations (Slack, CRM, SMS...)
- N'est pas dans le dépôt GitHub (c'est un outil séparé hébergé)

---

## 11. Rôle du Vercel AI SDK

Le **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) est utilisé pour alimenter l'assistant conversationnel.

### Fonctionnement technique
1. Le client envoie ses messages à la route Next.js `/api/ai/quote-assistant`
2. La route appelle `streamText()` du Vercel AI SDK avec le modèle `claude-sonnet-4-6`
3. La réponse est streamée en **Server-Sent Events (SSE)** → le texte apparaît mot par mot
4. Le SDK valide la réponse JSON via **Zod** (`QuoteAssistantSchema`)
5. Les villes sont revalidées par code (`validateCity()`)
6. Le résultat final est envoyé en une fois (event `done`)

### Pourquoi Vercel AI SDK
- Gestion native du streaming SSE
- Comptage automatique des tokens
- Compatible avec Next.js App Router
- Abstraction propre au-dessus de l'API Anthropic

---

## 12. Rôle de Vercel

Vercel est la plateforme de déploiement du **frontend Next.js**.

- **CI/CD automatique** : chaque push sur `main` → nouveau déploiement en 1 à 2 minutes
- **Variables d'environnement** : gérées depuis le dashboard Vercel (jamais dans le code)
- **Edge Network** : site servi depuis des points de présence mondiaux
- **Next.js API Routes** : les routes `/api/ai/quote-assistant` et `/api/quotes/[id]/benchmark` tournent comme fonctions serverless sur Vercel

---

## 13. Rôle des emails et relances

### Envoi du devis
Déclenché manuellement par le commercial via le bouton "Envoyer le devis" dans le dashboard. Le backend appelle n8n via webhook avec les données du devis. n8n génère et envoie l'email au client.

### Relances automatiques
- **Relance 1** : déclenchée si le devis est resté sans réponse
- **Relance 2** : seconde relance si toujours pas de réponse
- Chaque relance est loggée dans la table `logs`
- Le commercial peut aussi déclencher une relance manuelle depuis le dashboard

### Suivi client
Le client reçoit un **lien de suivi par token** (`/suivi/[token]`) dès sa demande. Il peut vérifier le statut de son dossier sans créer de compte. Le token est unique par lead.

---

## 14. Rôle du benchmark prix marché

Le benchmark est un **outil d'aide à la décision commerciale**, ajouté récemment. Il est **invisible côté client** et **ne modifie jamais le devis automatiquement**.

### Fonctionnement
1. Le commercial clique "Calculer" sur le bloc "Référentiel marché" dans la page du lead
2. Le backend interroge la base Supabase : tous les devis approuvés ou envoyés sur un trajet similaire (même OD, même type, ±30% de passagers) dans les 12 derniers mois
3. Si au moins 3 devis similaires existent : calcul du prix bas, prix médian, prix haut
4. Le résultat est stocké en base (`market_benchmarks`) et affiché au commercial
5. Si l'historique est insuffisant (< 3 trajets) : message "données insuffisantes"

### Ce que le benchmark n'est pas
- Ce n'est pas un calcul automatique de prix
- Ce n'est pas une règle tarifaire
- Ce n'est pas visible du client
- Il ne remplace pas `calculer_devis()`

---

## 15. Séparation automatisation / validation humaine

C'est un choix architectural fondamental du projet.

### Ce qui est automatisé
- Collecte et structuration des informations (formulaire + IA)
- Score de complétude
- Détection des cas complexes (escalade automatique)
- Calcul du devis (`calculer_devis()`)
- Envoi d'email via n8n (une fois validé)
- Relances (si configurées)
- Logging de toutes les actions
- Tracking token client

### Ce qui reste validé par un humain
- **Approbation du devis** : le commercial lit le devis avant qu'il parte au client
- **Ajustement manuel** : si le commercial juge que le prix calculé ne correspond pas au marché
- **Cas complexes** : le commercial reprend la main pour les dossiers hors standard
- **Déclenchement de l'envoi** : l'envoi n'est jamais automatique sans validation

### Pourquoi ce choix
Un devis de transport de groupe engage des montants significatifs. Une erreur de prix peut générer un litige commercial ou une perte financière. La validation humaine est un filet de sécurité intentionnel, pas une limitation technique.

---

## 16. Règles de sécurité importantes

| Règle | Application |
|---|---|
| L'IA ne calcule jamais un prix | Interdit dans le prompt ET dans le code |
| Pas de secret en `NEXT_PUBLIC_` | Toutes les clés sensibles sont server-only |
| `.env` et `.env.local` non commités | Protégés par `.gitignore` |
| Auth JWT côté backend | Token Bearer validé pour chaque requête protégée |
| Rôles stricts | Client ne voit jamais le dashboard, benchmark invisible côté client |
| RLS Supabase | Accès aux données filtrés par rôle en base |
| SUPABASE_SERVICE_ROLE_KEY | Jamais exposé côté navigateur, utilisé uniquement en server-side Next.js |

---

## 17. Limites actuelles du MVP

1. **Distance kilométrique estimée** : le calcul utilise une estimation, pas des km réels via API géocodage. C'est documenté dans les sources de calcul.
2. **Pas de matching autocariste** : aucun algorithme de mise en relation automatique avec un prestataire.
3. **Pas de signature électronique** : le client accepte verbalement, pas de document signé.
4. **Pas de paiement intégré** : facturation hors plateforme.
5. **Relances non planifiées automatiquement** : déclenchées manuellement ou via n8n si configuré.
6. **Session stockée en localStorage** : fonctionnel pour MVP, à renforcer en production à fort volume.
7. **Benchmark avec historique limité** : nécessite un historique interne suffisant pour être utile (minimum 3 trajets similaires).

---

## 18. Prochaines évolutions possibles

Listées dans le code même (`MVPSection`) :

1. Distances kilométriques réelles via API géocodage (Google Maps, OpenRouteService)
2. Matching automatique avec les autocaristes partenaires
3. Signature électronique du devis (DocuSign / Yousign)
4. Espace client complet (suivi, modifications)
5. Paiement et facturation intégrés
6. Relances automatisées planifiées (cron job)
7. Enrichissement du benchmark avec sources externes (via n8n)

---

*Audit réalisé sur la base du code source réel — branche `main`, état juillet 2026.*
