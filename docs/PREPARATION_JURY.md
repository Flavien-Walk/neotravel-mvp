# NeoTravel — Préparation jury

> Pitchs prêts à réciter, questions probables avec réponses préparées, objections et stratégie de présentation.

---

## 1. Pitch 1 minute

> À réciter calmement, sans précipitation.

---

"NeoTravel, c'est une plateforme web qui automatise la gestion des demandes de devis de transport de groupes en autocar.

Aujourd'hui, ce processus est long et manuel : un client appelle, attend plusieurs jours pour un devis sans explication, et n'a aucune visibilité sur l'avancement de son dossier.

Avec NeoTravel, un client peut déposer sa demande en 3 à 5 minutes — soit via un formulaire guidé, soit en discutant avec un assistant IA conversationnel. Le devis est calculé automatiquement par un moteur de règles déterministe, puis validé par un commercial avant d'être envoyé au client par email.

L'IA collecte les informations. Elle ne fixe jamais un prix — c'est une règle commerciale et technique non négociable. Le prix vient d'un algorithme traçable, chaque ligne de devis ayant sa formule et sa source.

Le résultat : un gain de temps significatif pour l'équipe commerciale, un parcours client fluide, et une traçabilité complète de chaque dossier."

---

## 2. Pitch 3 minutes

---

"NeoTravel résout un problème concret dans le secteur du transport de groupes : le processus de devis est archaïque. Appel téléphonique, email, attente de 24 à 72 heures, devis reçu sans aucune explication. Pour le client, c'est opaque et frustrant. Pour l'équipe commerciale, c'est chronophage et source d'erreurs.

Nous avons construit une plateforme qui digitalise et automatise ce parcours de bout en bout.

**Côté client :** il accède à la page de demande de devis, et peut choisir entre un formulaire guidé étape par étape ou un assistant IA conversationnel. L'assistant est alimenté par Claude d'Anthropic via le Vercel AI SDK. Il comprend la demande en langage naturel, pose les questions manquantes et structure les données automatiquement. Lorsque toutes les informations sont collectées, un lead est créé en base de données. Le client reçoit immédiatement un lien de suivi personnalisé, sans avoir besoin de créer un compte.

**Côté calcul :** le devis est calculé par un moteur déterministe sur le backend — en tenant compte de la distance, de la durée, du nombre de passagers, du type de trajet et des options. Chaque ligne du devis affiche la formule et la source utilisée. L'IA n'intervient pas dans ce calcul : c'est une règle fondatrice du projet, imposée techniquement, pas juste demandée poliment.

**Côté commercial :** tout est centralisé dans un dashboard. Le commercial voit les leads entrants, peut consulter un référentiel de prix marché basé sur l'historique interne, ajuster manuellement le prix si nécessaire avec une justification, valider le devis, et déclencher l'envoi par email via n8n. Il peut aussi relancer le client si pas de réponse.

**La stack :** Next.js 14 sur Vercel pour le frontend, Express.js sur Render pour le backend, Supabase (PostgreSQL) pour la base de données, Claude via Vercel AI SDK pour l'IA, et n8n pour les automatisations email.

Ce MVP est fonctionnel et déployé. Il couvre l'ensemble du cycle de vie d'un lead, de la demande à la clôture."

---

## 3. Pitch technique (pour un jury technique)

---

"Côté architecture, le projet est un monorepo GitHub avec deux branches de déploiement : `main` pour le frontend Next.js 14 App Router déployé sur Vercel, et `backend` pour l'API Express déployée sur Render.

Le frontend est en TypeScript strict, avec Tailwind CSS, Framer Motion pour les animations, et Zod pour la validation de schémas. L'authentification est gérée par JWT Bearer côté backend, avec token persisté dans localStorage côté client.

La base de données est Supabase (PostgreSQL), avec Row Level Security activé sur toutes les tables. Cinq tables principales : `users`, `leads`, `quotes`, `logs`, `market_benchmarks`.

L'assistant IA utilise le Vercel AI SDK avec le provider `@ai-sdk/anthropic`, en mode streaming SSE. La route `/api/ai/quote-assistant` streame les tokens au client en temps réel, extrait les champs structurés via un prompt système strict, valide la sortie avec Zod, puis revalide les villes côté code avec `validateCity()`.

Pour les emails et relances, n8n reçoit des webhooks depuis le backend et orchestre l'envoi. La route benchmark (`/api/quotes/[id]/benchmark`) est une route Next.js serverless qui utilise la service role key Supabase (jamais exposée côté client) pour interroger l'historique des devis approuvés.

Le tout est typé de bout en bout : les types du `src/types/index.ts` sont partagés entre le frontend et les routes API, avec des interfaces pour `Lead`, `Quote`, `Log`, `MarketBenchmark`, `LigneCalcul`, `CalculationSource`."

---

## 4. Questions probables du jury — Réponses préparées

---

### "Pourquoi avoir choisi ce projet ?"

"Le transport de groupe est un marché réel, avec des acteurs qui fonctionnent encore très manuellement. C'était une opportunité concrète d'appliquer ensemble plusieurs technologies récentes — IA conversationnelle, automatisation de workflows, base de données relationnelle — sur un cas d'usage B2B clairement défini. Et surtout, c'est un projet qui a des contraintes métier fortes : on ne peut pas se permettre une erreur de prix, ce qui force à des choix d'architecture réfléchis."

---

### "Quel problème métier est résolu ?"

"La lenteur et l'opacité du processus de devis transport de groupe. Un client attend en moyenne 24 à 72h pour recevoir un devis, sans explication. Avec NeoTravel, la demande est structurée et qualifiée en 3 minutes, le devis est calculé automatiquement, validé par un humain et envoyé par email. Le client a une visibilité en temps réel. L'équipe commerciale gagne du temps sur les cas standard et se concentre sur les cas complexes."

---

### "Qu'est-ce qui est vraiment automatisé ?"

"Plusieurs étapes : la collecte et la structuration des informations client via le formulaire ou l'IA, le calcul du devis selon des règles tarifaires documentées, la détection automatique des cas complexes qui nécessitent une intervention humaine, la création du lien de suivi client, l'envoi de l'email une fois validé, les relances si pas de réponse, et le logging de toutes les actions. Ce qui reste manuel : la validation du devis par un commercial avant envoi, et la gestion des cas complexes."

---

### "Pourquoi utiliser n8n ?"

"n8n nous permet de gérer les automatisations email sans coder un service d'envoi de A à Z. Le workflow d'envoi est visuel et modifiable sans toucher au code : si on change le template, on le change dans n8n, pas dans le codebase. C'est aussi facilement extensible — on peut brancher un Slack, un CRM, ou des SMS sans réécrire le backend. Dans notre cas, n8n reçoit un webhook depuis l'API, formate l'email avec les données du devis, et l'envoie. Simple, découplé et maintenable."

---

### "Pourquoi utiliser Supabase ?"

"Supabase nous donne PostgreSQL managé avec Row Level Security intégré, une interface admin pour visualiser les données, et un SDK JavaScript propre. Par rapport à MongoDB, on bénéficie d'un modèle relationnel strict qui convient bien à nos entités (un lead a un devis, un devis a des lignes de calcul, un devis a un benchmark). Le RLS nous permet d'isoler les données par rôle au niveau de la base, pas seulement dans le code applicatif. Et le déploiement est gratuit pour un MVP."

---

### "À quoi sert Vercel AI SDK ?"

"Le Vercel AI SDK est une couche d'abstraction au-dessus des APIs LLM. Il nous fournit la fonction `streamText()` qui gère le streaming des tokens en SSE, le comptage de tokens, et la compatibilité avec Next.js App Router. Sans lui, on devrait gérer manuellement l'EventSource, les chunks, les erreurs de réseau, et le comptage. Il nous permet aussi de changer de modèle ou de provider facilement si besoin."

---

### "Est-ce que l'IA calcule le prix ?"

"Non, et c'est un choix architectural délibéré. L'IA collecte les informations. Le prix est calculé par `calculer_devis()`, un algorithme déterministe sur le backend. Cette règle est imposée à trois niveaux : dans le prompt (l'IA est instruite de refuser tout calcul), dans le code (aucune logique de prix dans le frontend ou dans la route IA), et dans l'architecture (le calcul se fait uniquement côté backend). Un jury, un client ou un auditeur peut vérifier que la règle tient en lisant le code — ce n'est pas une promesse, c'est une contrainte technique."

---

### "Comment évitez-vous les erreurs de devis ?"

"Plusieurs garde-fous. D'abord, le score de complétude : si des informations manquent, le lead est marqué `incomplet` et pas calculé. Ensuite, la validation des villes par code : si une ville est inconnue ou ambiguë, le dossier bascule automatiquement en reprise humaine. Ensuite, les sources de calcul sont documentées dans chaque ligne (`regle_documentee`, `hypothese_mvp`, `a_definir`) — le commercial sait exactement sur quoi repose chaque montant. Enfin, la validation humaine : le devis n'est jamais envoyé sans qu'un commercial l'ait lu et approuvé."

---

### "Pourquoi garder une validation humaine ?"

"Parce que les enjeux sont commerciaux et financiers. Un devis de transport de groupe peut représenter plusieurs milliers d'euros. Une erreur génère un litige. La validation humaine n'est pas un aveu d'insuffisance de l'automatisation — c'est une décision réfléchie. L'automatisation s'occupe des cas standard rapidement, le commercial garde la main sur la décision finale. C'est ce qu'on appelle un système human-in-the-loop."

---

### "Comment sont envoyés les emails ?"

"Via n8n. Lorsque le commercial clique sur 'Envoyer le devis' dans le dashboard, le backend appelle un webhook n8n. n8n récupère les données du devis (prix, lignes de calcul, informations client), formate un email HTML et l'envoie. La même logique s'applique pour les relances. Ce découplage permet de modifier les templates sans toucher au code backend."

---

### "Comment fonctionnent les relances ?"

"Lorsqu'un devis est envoyé et qu'il n'y a pas de réponse, le commercial peut déclencher une relance depuis le dashboard — bouton 'Relancer'. Le backend envoie une requête à n8n qui renvoie un email de rappel au client. Le statut du lead passe à `relance_1`, puis `relance_2` à la seconde relance. Chaque relance est loggée avec sa date. Le nombre de relances et la date de la dernière relance sont stockés dans la table `quotes`."

---

### "Comment fonctionne le benchmark marché ?"

"C'est un outil d'aide à la décision visible uniquement dans le dashboard commercial. Quand le commercial ouvre un devis, il peut cliquer sur 'Calculer' dans le bloc 'Référentiel marché'. Le système interroge la base de données Supabase : il cherche les devis approuvés ou envoyés sur un trajet similaire (même origine-destination, même type de trajet, ±30% de passagers) dans les 12 derniers mois. Si au moins 3 résultats, il calcule le prix bas, médian et haut. C'est indicatif uniquement — ça ne modifie pas le devis, et c'est clairement signalé dans l'interface."

---

### "Est-ce que les données client sont protégées ?"

"Oui, à plusieurs niveaux. Les secrets (ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY) ne sont jamais dans le code ni exposés côté navigateur. L'authentification est par JWT Bearer, validé à chaque requête. Supabase a le Row Level Security activé sur toutes les tables. Les données clients (email, téléphone) ne sont accessibles que par les rôles commercial et admin. Le benchmark prix marché, qui est une donnée interne, n'est pas accessible côté client. Et les fichiers `.env` sont dans le `.gitignore` — aucun secret dans l'historique Git."

---

### "Quelles sont les limites du MVP ?"

"Cinq limites principales. Premièrement, les distances kilométriques sont estimées, pas calculées via une API de géocodage réelle — c'est documenté dans les sources de calcul. Deuxièmement, il n'y a pas de matching automatique avec des autocaristes partenaires. Troisièmement, pas de signature électronique ni de paiement intégré — le devis est envoyé et accepté verbalement. Quatrièmement, les relances ne sont pas encore planifiées automatiquement par cron. Cinquièmement, le benchmark est utile uniquement quand l'historique interne est suffisamment fourni. Ces limites sont documentées dans le code lui-même."

---

### "Que feriez-vous avec plus de temps ?"

"Dans l'ordre de priorité : les distances kilométriques réelles via OpenRouteService, les relances automatiques planifiées par cron dans n8n, la signature électronique avec Yousign, le matching automatique avec les autocaristes partenaires, et enfin un espace client complet pour suivre et modifier une demande. Ce sont les six items dans la section 'Prochaines évolutions' du produit."

---

### "Quelle partie a été la plus complexe ?"

"Plusieurs points ont nécessité du travail de conception. Le premier : garantir que l'IA ne calcule jamais un prix, même si un utilisateur tente de la manipuler — ça demande un prompt précis, des exemples d'anti-injection, et une revalidation côté code. Le deuxième : la gestion du cycle de vie des leads avec des statuts multiples et des transitions logiques entre eux. Le troisième : le streaming SSE avec le Vercel AI SDK, notamment l'extraction en temps réel du champ `message` depuis le JSON partiel streamed par Claude."

---

### "Comment tester le projet ?"

"Trois niveaux de test. Pour le parcours client : aller sur la page /devis, déposer une demande via le formulaire ou l'IA, recevoir le lien de suivi, et suivre l'avancement sur /suivi/[token]. Pour le dashboard : se connecter avec un compte commercial ou admin sur /login, et parcourir les leads, consulter un devis, tenter un ajustement. Pour l'API : les routes sont documentées dans `src/lib/api.ts` et testables via Postman avec un token JWT valide. Il n'y a pas encore de suite de tests automatisés — c'est une limite assumée du MVP."

---

### "Comment passer ce MVP en production réelle ?"

"Cinq étapes. Un : sécuriser l'authentification (passer d'un token localStorage à des cookies httpOnly). Deux : brancher une API de géocodage réelle pour les distances. Trois : auditer et finaliser les règles tarifaires dans `calculer_devis()`. Quatre : mettre en place la surveillance (logs d'erreur, alertes, dashboard Supabase). Cinq : ajouter une suite de tests automatisés (au minimum des tests d'intégration sur les routes critiques : création de lead, calcul de devis, envoi email). Le reste de la stack est déjà en production — Vercel, Render, Supabase, n8n."

---

## 5. Objections possibles et réponses

---

**"L'IA peut se tromper sur les villes."**
"C'est pourquoi on ne fait pas confiance à l'IA pour ça. Chaque ville extraite par l'IA est revalidée par du code via `validateCity()`, qui cherche dans une base de villes françaises. Si la ville est inconnue ou ambiguë, le dossier est automatiquement escaladé vers un humain. L'IA fait une première extraction, le code fait la vérification."

---

**"Pourquoi ne pas tout automatiser, y compris l'envoi ?"**
"Parce que les enjeux financiers le justifient. Un devis commercial engage l'entreprise sur un prix. Si le calcul contient une erreur (mauvaise distance estimée, mauvais coefficient), envoyer automatiquement sans validation humaine pourrait créer un litige. La validation humaine est un investissement de quelques minutes qui protège contre des erreurs coûteuses."

---

**"Votre historique de benchmark est vide au démarrage."**
"C'est vrai, et c'est documenté. Le benchmark est utile à partir d'un minimum de 3 devis similaires dans l'historique. En démarrage, le système l'indique clairement et invite le commercial à utiliser son jugement. La valeur du benchmark augmente avec l'utilisation — c'est un outil qui s'améliore dans le temps, pas une promesse immédiate."

---

**"MongoDB → Supabase, c'est une migration en cours ?"**
"La migration est faite. La branche backend utilise maintenant Supabase (PostgreSQL) à la place de MongoDB. Le document de passation indique encore MongoDB car il n'a pas encore été mis à jour, mais le code en production est sur Supabase. On peut le vérifier directement dans les tables visibles dans le dashboard Supabase."

---

**"Vous n'avez pas de tests automatisés."**
"C'est une limite assumée du MVP. Les ressources ont été priorisées sur les fonctionnalités métier. Les tests manuels couvrent les parcours critiques. En production réelle, les premiers tests à écrire seraient les routes de calcul de devis (déterministe, donc testable unitairement) et les routes d'authentification."

---

## 6. Stratégie pour une démo fluide

### Préparation
- Avoir un compte commercial créé et connecté à l'avance
- Avoir au moins 2 leads en base avec des statuts différents (un nouveau, un avec devis calculé)
- Vérifier que le backend Render est bien réveillé (peut dormir en tier gratuit)
- Avoir les variables Supabase en place sur Vercel (benchmark fonctionnel)

### Ordre de présentation recommandé
1. **Côté client** : ouvrir `/devis`, montrer les deux modes (formulaire + IA), déposer une demande rapide
2. **Page merci** : montrer le lien de suivi
3. **Dashboard** : se connecter, montrer la vue d'ensemble avec le pipeline
4. **Lead detail** : ouvrir un lead avec devis calculé, montrer les lignes de calcul détaillées
5. **Validation** : montrer le bandeau "En attente de validation", le benchmark prix marché
6. **Logs** : montrer l'historique des actions

### Ce qu'il ne faut pas montrer en démo
- Le mode sombre si vous n'êtes pas sûr que les couleurs sont correctes dans les screenshots
- Les cas d'erreur (body vide 500) si Supabase n'est pas configuré
- L'écran de login de n8n (c'est un outil interne, expliquer sans montrer)

### Phrase de clôture
"Ce projet est fonctionnel et déployé. Il couvre l'intégralité du cycle de vie d'un lead de transport de groupe — de la demande au closing. Il est conçu pour être extensible : chaque couche (IA, calcul, envoi, base de données) est découplée et indépendante."

---

## 7. Récapitulatif — Arguments clés

### Les 5 arguments les plus forts

1. **La règle de sécurité commerciale** : l'IA ne calcule jamais un prix. Ce n'est pas une promesse — c'est imposé techniquement à trois niveaux (prompt, code, architecture).

2. **La traçabilité complète** : chaque devis affiche ses lignes de calcul avec formule, source et justification. Chaque action est loggée. C'est auditables.

3. **Le système human-in-the-loop** : l'automatisation s'occupe des cas standard, l'humain garde la main sur la validation finale et les cas complexes. Ce n'est pas un produit qui essaie de remplacer le commercial, mais de l'assister.

4. **La stack moderne et découplée** : Next.js, Supabase, Vercel AI SDK, n8n, Render. Chaque composant est indépendant, remplaçable, et approprié à son usage.

5. **Un MVP honnête** : le code liste explicitement ce qui fonctionne et ce qui ne fonctionne pas encore. La roadmap est documentée dans le produit lui-même (`MVPSection`).

### Les 5 questions les plus dangereuses

| Question | Danger | Réponse clé |
|---|---|---|
| "L'IA peut elle se tromper sur un prix ?" | Remet en cause la fiabilité | "Non — l'IA ne calcule pas. Le calcul est déterministe et côté backend uniquement." |
| "Qu'est-ce qui garantit que les données sont sécurisées ?" | Remet en cause la sécurité | "JWT, RLS Supabase, secrets jamais exposés, .gitignore." |
| "Vous n'avez pas de tests ?" | Remet en cause la qualité | "Limite assumée du MVP, priorité aux fonctionnalités, prochaine étape connue." |
| "Le benchmark est vide au démarrage — ça sert à quoi ?" | Remet en cause la valeur | "Outil qui grandit avec l'usage, clairement signalé comme indicatif." |
| "Comment gérez-vous les distances ?" | Remet en cause la précision | "Estimations documentées, limite connue et documentée dans les sources de calcul, distances réelles = prochaine étape." |

---

*Document préparé à partir du code source réel. Version juillet 2026.*
