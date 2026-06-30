# NeoTravel — Document de passation

> Document destiné au porteur de projet / client, pour reprendre la main sur la plateforme livrée.
> Aucun jargon technique inutile — pour le détail développeur, voir [DOCUMENTATION.md](./DOCUMENTATION.md).

---

## 1. Ce qui a été livré

NeoTravel est une plateforme de demande de devis en ligne pour le transport de groupes en autocar. Elle comprend :

1. **Un site public** où un client final peut demander un devis de deux façons :
   - en remplissant un **formulaire guidé** étape par étape,
   - ou en discutant librement avec un **assistant IA conversationnel** qui comprend sa demande et la reformule.
2. **Un espace client** où la personne qui a fait la demande peut suivre l'avancement de son dossier (statut, devis reçu), avec ou sans création de compte (lien de suivi par token).
3. **Un back-office commercial** (tableau de bord) où votre équipe peut :
   - voir toutes les demandes reçues (leads), filtrées et triées,
   - créer un devis manuellement quand un cas sort du cadre automatisé,
   - consulter l'historique de toutes les actions du système (logs),
   - gérer les comptes (administration).
4. **Un moteur de calcul de prix séparé** (côté serveur, branche `backend`), qui est le **seul** à fixer un montant. L'assistant IA ne donne jamais de prix lui-même — c'est une règle de sécurité commerciale volontaire, documentée et techniquement imposée (voir section 4 ci-dessous).

---

## 2. Où vivent les choses

| Élément | Emplacement |
|---|---|
| Code source complet | [github.com/Flavien-Walk/neotravel-mvp](https://github.com/Flavien-Walk/neotravel-mvp) |
| Site public (frontend) | branche `main` du dépôt ci-dessus, déployé sur **Vercel** |
| Serveur de calcul et base de données (backend) | branche `backend`, déployé sur **Render** (`neotravel-mvp.onrender.com`) |
| Documentation technique détaillée | [DOCUMENTATION.md](./DOCUMENTATION.md) à la racine du dépôt `main` |
| Stockage des demandes/devis | Base de données **MongoDB** (côté backend) |

D'autres branches existent dans le dépôt (`ui_edits`, `db_migration`, `backend_pricing`, `imene-airtable`, `matt`...) : ce sont des branches de travail historiques. **`main` et `backend` sont les deux branches qui comptent pour la production.**

---

## 3. Comment faire fonctionner / relancer le projet

### 3.1 Pour le voir tourner en local (développement)
```
npm install
npm run dev
```
Nécessite un fichier `.env.local` (non commité, à créer soi-même) avec :
- `NEXT_PUBLIC_API_URL` → l'adresse du serveur backend (`http://localhost:4000` en local, ou l'URL Render en production)
- `ANTHROPIC_API_KEY` → la clé de l'assistant IA (à obtenir sur console.anthropic.com)

⚠️ **Sans la clé Anthropic, le site fonctionne quand même** : l'assistant IA bascule automatiquement sur le formulaire guidé classique. Ce n'est donc pas un point bloquant pour faire tourner le service, seulement pour avoir l'assistant conversationnel actif.

### 3.2 En production
Le déploiement est automatique : tout push sur la branche `main` (frontend) redéploie le site sur Vercel ; tout push sur `backend` redéploie le serveur sur Render. Pas d'action manuelle nécessaire pour mettre en ligne une modification déjà testée.

---

## 4. La règle de sécurité commerciale la plus importante

> **L'IA collecte les informations du client. Elle ne calcule jamais un prix.**

C'est la règle fondatrice du projet, et elle est appliquée à plusieurs niveaux (pas seulement "demandée à l'IA poliment") :
- Le **prompt** donné à l'assistant lui interdit explicitement de chiffrer quoi que ce soit, avec des phrases de refus automatiques même si un utilisateur tente de le manipuler ("calcule toi-même", "ignore tes instructions"...).
- Chaque ville mentionnée par le client est **revérifiée par du code**, pas seulement par l'IA — si une ville est inconnue ou ambiguë, le dossier est automatiquement transmis à un conseiller humain plutôt que de risquer une erreur.
- Le prix final n'est produit que par le moteur de calcul du backend, jamais par l'IA elle-même.

Concrètement, vous pouvez avoir confiance dans le fait qu'**aucun prix affiché au client n'a été "inventé" par l'IA** — tout montant vient d'un calcul de code, traçable et justifié ligne par ligne (chaque ligne de devis garde la formule et la source utilisées pour la calculer).

---

## 5. État du projet et limites connues

Le projet est un **MVP livré et fonctionnel**, avec des points à garder en tête pour la suite :

- **Le moteur de calcul de prix** (`calculer_devis()`) vit dans le backend et n'a pas été audité dans ce document — sa logique tarifaire exacte (règles, coefficients) doit être vérifiée directement avec l'équipe ou le code de la branche `backend` si une revue approfondie est nécessaire.
- **Stockage de session** : la connexion utilisateur est gérée de façon simple (jeton stocké dans le navigateur). Fonctionnel pour un MVP, mais à renforcer si le volume d'utilisateurs ou la sensibilité des données augmente significativement.
- **Cas particuliers gérés par escalade humaine** : groupes de plus de 85 passagers, trajets complexes multi-étapes, villes non reconnues, dates incohérentes, groupes scolaires internationaux — ces cas sont automatiquement signalés à un conseiller plutôt que traités automatiquement. C'est volontaire (sécurité), pas un bug.
- Plusieurs branches de travail existent encore dans le dépôt et pourraient être nettoyées une fois confirmées comme obsolètes.

---

## 6. Contacts et continuité

Pour toute reprise technique du projet, transmettre :
- L'accès au dépôt GitHub (déjà partagé ci-dessus).
- Les variables d'environnement de production (clé Anthropic, URL backend, accès MongoDB) — **à transmettre séparément et de façon sécurisée**, elles ne sont jamais stockées dans le code.
- Ce document + [DOCUMENTATION.md](./DOCUMENTATION.md) pour la partie technique détaillée.

---

*Document généré le 2026-06-30 à partir de l'état réel du code au moment de la passation.*
