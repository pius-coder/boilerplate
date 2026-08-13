# African Regional Baseline — Dossier de transformation

Runbook de la transformation africaine du boilerplate : identité régionale,
contexte pays, argent, et dossiers de migration **paiement (Fapshi) et
observabilité (Temps)**. Ce document est un dossier de travail : chaque
affirmation est vérifiée dans le dépôt ou contre une source officielle datée du
11/08/2026. Les chemins listés dans la cartographie Stripe (AC6) ont tous été
vérifiés présents.

---

## 1. État actuel (audit vérifié)

- **Aucun code région/pays/devise** n'existait avant ce lot dans `src/`,
  `apps/`, `tests/`.
- **Stripe est l'unique fournisseur de paiement**, câblé dans le schéma, les
  modèles, les services, les routes, la console admin et la validation d'environnement
  (voir §6).
- **Temps analytics est livré en option** côté application web : configuration
  absente par défaut, production seulement, consentement explicite et proxy
  same-origin. Google Analytics reste le fallback et l'admin ne charge aucun
  provider analytics. Le suivi d'erreurs Sentry-compatible est séparé et
  activé uniquement lorsque Temps injecte son DSN public.
- **`output: "standalone"` est présent dans les deux configurations Next** et
  les deux applications exposent un `/api/health` de liveness sans dépendance.
  Ceci prouve les artefacts locaux, pas un déploiement Temps réel (voir §8).

## 2. Identité régionale — `src/config/regions.ts`

Source unique des défauts régionaux. Profil Cameroun livré par défaut :

| Champ | Valeur | Sens |
| --- | --- | --- |
| `code` | `"CM"` | ISO 3166-1 alpha-2 |
| `currency` / `currencyExponent` | `"XAF"` / `0` | Le franc est l'unité mineure |
| `callingCode` | `"+237"` | E.164 |
| `timeZone` | `"Africa/Douala"` | IANA |
| `mobileNumberPattern` | `/^6\d{8}$/` | National, sans indicatif |
| `suggestedLocales` | `["fr", "en"]` | Indices uniquement ; `src/i18n/locale.ts` reste l'autorité |

Ajouter une région = un profil dans `REGION_PROFILES` + membre de `RegionCode`.
Inconnu → `DEFAULT_REGION_CODE` (un défaut d'affichage ne vaut pas un échec).

## 3. Argent — `src/lib/money.ts`

Tous les montants sont des **entiers en unités mineures** ; aucun calcul en
virgule flottante.

**Contrat de formatage (explicite) :**
- `formatMinorUnits(amount, currency, locale, exponent?)` — l'exposant est
  optionnel ; s'il est omis, il est résolu par la table déterministe
  `resolveCurrencyExponent(currency)` (ISO 4217 : `XAF` → 0, devises zéro-décimal
  → 0, dinars du Golfe → 3, tout autre code 3 lettres valide → 2). Un exposant
  explicite prime sur la table.
- La conversion unités mineures → décimal passe par `minorUnitsToDecimalString`
  (BigInt pur) et la chaîne exacte est passée à `Intl.NumberFormat` — qui
  l'analyse comme valeur mathématique : **pas de perte de précision**, pas de
  `bigint`→`number` risqué. `1099` unités USD (exposant 2) s'affiche `10.99`,
  jamais `1099.00` ; XAF reste sans décimales.
- Toute entrée non sûre (`isSafeMinorUnits`) ou tout exposant invalide → `RangeError`.
- Aucune connaissance des crédits, commandes, Fapshi ou Stripe.

## 4. Contexte pays — middleware

Ordre : **cookie valide → header geo configuré → défaut**.

- Cookie `app_country` ; header interne `x-app-country`.
- Le middleware **supprime toujours** un `x-app-country` entrant, écrit la valeur
  résolue (headers forwardés + réponse).
- Détection **désactivée par défaut** ; opt-in via `COUNTRY_DETECTION_HEADER`,
  liste fermée : `cf-ipcountry`, `x-vercel-ip-country`, `cloudfront-viewer-country`,
  `x-country-code`. **Une valeur hors liste échoue la validation d'environnement**
  (`src/lib/env.ts`) au lieu de désactiver silencieusement la détection ; l'absence
  de variable reste valide = « désactivé ». Le proxy de confiance doit écraser le
  header choisi et supprimer les copies client.
- Le middleware lit `process.env.COUNTRY_DETECTION_HEADER` directement (jamais
  `getAppEnv()` — il ne doit pas tirer les secrets de production). Server-only,
  **aucune variante `NEXT_PUBLIC_*`** (règle architecture test).
- **Conséquence assumée :** une valeur invalide posée dans l'environnement est
  *ignorée silencieusement par le middleware* (détection OFF) — c'est le
  contrat, car le middleware ne peut pas appeler `getAppEnv()`. La protection
  est la validation fermée de `validateAppEnv()` au boot, qui échoue sur toute
  valeur hors liste. Le middleware, lui, ne doit jamais échouer pour un
  header.
- Le contexte pays est un **défaut d'affichage/paiement, jamais une entrée
  d'autorisation**.

## 5. Téléphones — `src/lib/phone-number.ts`

`normalizePhoneNumber(input, profile)` : national, avec indicatif ou E.164
(espaces/tirets/parenthèses tolérés) → E.164 canonique. Rejette préfixes
étrangers, longueurs erronées, lettres, extensions. Aucune classification
opérateur (MTN/Orange) — elle appartient au futur adaptateur de paiement.

## 6. Cartographie Stripe (AC6) — vérifiée chemin par chemin

**Principe :** la neutralisation de Stripe ne consiste PAS à remplacer des Price
IDs et un client SDK. C'est une migration de domaine : colonnes de schéma,
modèles, services, routes, console admin, effacement de compte, env et docs.
Le schéma (`src/db/schema.ts`) est **protégé** ce lot-ci : toute évolution
viendra dans un lot ultérieur via des migrations expand/contract sûres
(AGENTS.md, DEPLOYMENT.md).

| # | Groupe | État actuel (chemins vérifiés) | Couplage Stripe | Cible générique | Backfill / compat | Phase | Invariant à préserver |
|---|---|---|---|---|---|---|---|
| 1 | Schéma et modèles | `src/db/schema.ts` (protégé) : `users.stripe_customer_id`, `organizations.stripe_customer_id`, `orders.stripe_session_id/stripe_payment_intent_id/stripe_charge_id/stripe_price_id`, `subscriptions.stripe_subscription_id/stripe_customer_id/stripe_price_id`, `stripeWebhookEvents` (event_id, status, attempts). Modèles : `order.ts`, `subscription.ts`, `user.ts`, `organization.ts`, `fulfillment.ts`, `stripe-webhook-event.ts`, `account-lifecycle.ts` | Colonnes de schéma nommées Stripe | Colonnes génériques (`payment_provider`, `payment_transaction_id`, …) en double pendant l'expand | Colonnes conservées (rempliées) jusqu'à la bascule ; suppression différée après validation | Expand → Bascule → Contract | Chaque paiement = un seul effet (idempotence, tests replay) |
| 2 | Catalogue plans et prix | `src/config/billing.ts` (`stripePriceIds`, montants, crédits par période), `src/config/plans.ts` (`tierForPriceId`), `src/config/pricing.ts` ; env `STRIPE_PRICE_*` + alias `NEXT_PUBLIC_STRIPE_PRICE_*` (`src/lib/env.ts`) | Les prix sont des IDs Stripe (`price_*`), vérifiés au boot | `src/config/payments.ts` : provider + références locales (`plan_slug`), montants en mineurs | Les IDs Stripe restent des références de secours ; mapping par slug | Expand | Montants en entiers mineurs, grille de prix unique |
| 3 | Checkout et idempotence | `src/app/api/checkout/route.ts`, `src/services/stripe/checkout-session.ts`, `idempotency.ts` (`orderPayTransNo`, `renewalOrderNo`, `subscriptionPeriodTransNo`), `action-required.ts` (3DS), `src/app/api/pay/callback/stripe/route.ts`, `src/models/order.ts` (session + dédupe intent/charge) | Session Stripe + intents idempotents | `externalId` Fapshi = référence métier portant `order_no` ; adapter générique `PaymentAdapter` | L'idempotence existante s'exprime déjà sur des trans_no locaux | Expand | Une transaction de crédit par paiement (replay), ordre de fulfillment |
| 4 | Clients et services Stripe | `src/integrations/stripe.ts` (`newStripeClient`, construction unique imposée par test), `src/services/stripe/index.ts`, `customer.ts` (`getOrCreateCustomerIdForOrg`), `refund.ts`, `receipt.ts`, `sweep.ts` | Client SDK et logique mêlés dans `services/stripe/` | `src/services/payments/` + `src/integrations/fapshi.ts` (construction seule) | Le client Stripe reste branché pendant l'expand | Expand | Un seul point de construction du client externe |
| 5 | Abonnements et portail | `src/models/subscription.ts`, `src/services/stripe/portal.ts`, `sweep.ts` (renouvellements), `src/services/entitlements.ts` (capabilités) | Statut d'abonnement Stripe + portail | État d'abonnement local + portail du fournisseur (à définir) | Migration des abonnés actifs : re-création côté Fapshi avec `externalId` stable | Bascule (pilotée) | Crédit accordé une fois par période facturée |
| 6 | Webhooks, événements, réconciliation | **Chemin réel du webhook : `src/app/api/pay/webhook/stripe/route.ts`** ; `src/models/stripe-webhook-event.ts` (dédupe `event_id` `ON CONFLICT DO NOTHING`, statuts `action_required`/`failed`, attempts) ; `src/services/stripe/reconcile.ts` ; admin : `apps/admin/app/(admin)/reconciliation`, `stripe-events`, `components/resolve-stripe-event.tsx`, `/api/admin/stripe-events/[eventId]/resolve/route.ts` | Signature `Stripe.webhooks.constructEvent` + dédupe par event_id | Webhook Fapshi idempotent (clé métier = `externalId` + statut), **statut serveur vérifié avant tout crédit/fulfillment** | Le registre d'événements actuel devient un registre générique d'événements de paiement | Bascule | Dédupe par identifiant d'événement, rejeu sans double effet |
| 7 | Réservations et affiliations | `src/services/reservations/index.ts` (sessions de checkout Stripe : `claimReservationCheckout`, `confirmReservationPayment`, `ActionRequiredError`, `STRIPE_MIN_SESSION_LIFETIME_MS`), `src/models/reservation.ts` (`checkout_intent_id`, `checkout_fingerprint`) ; `src/services/affiliate.ts` + `src/models/affiliate.ts` (commissions enregistrées ; paiement des affiliés = responsabilité de l'adoptant) | Réservations : checkout Stripe. Affiliations : seulement idempotence d'événements | Réservations via l'adaptateur générique ; affiliations inchangées (pas de payout auto) | Migration des sessions réservées en cours (fenêtre de 30 min) | Bascule | Prise d'une réservation = une seule session, pas de double réservation |
| 8 | Organisations et propriété des achats | `src/models/organization.ts` (`stripe_customer_id`), `orders` liés à `org_uuid`, admin `apps/admin/app/(admin)/organizations`, `organizations/[uuid]` | Client Stripe au niveau organisation | Compte de facturation générique lié à l'organisation | Rafraîchissement des `stripe_customer_id` existants | Bascule | Propriété de l'achat = organisation, pas l'utilisateur |
| 9 | Console admin | `apps/admin/app/(admin)/orders`, `organizations`, `organizations/[uuid]`, `page.tsx`, `reconciliation`, `stripe-events`, `components/manage-plan.tsx`, `admin-shell.tsx`, `lib/data.ts`, `lib/api.ts`, `lib/audit.ts`, `/api/admin/users/[uuid]/plan/route.ts` | Vues et actions câblées sur les champs Stripe | Vues génériques (statut de paiement, transaction) | Doubles vues pendant la bascule | Expand → Bascule | Audit de chaque action admin |
| 10 | CSP, env, effacement, docs | CSP : `src/config/security-headers.ts` (aucune entrée Stripe ; hôtes vendeurs seulement pour analytics/ads). Env : `STRIPE_PRIVATE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`, `STRIPE_PRICE_*`, `NEXT_PUBLIC_PAY_SUCCESS/FAIL/CANCEL_URL` (obligatoires en prod). Effacement : `src/services/stripe/account-erasure.ts` (annule abonnements, supprime clients) + `src/models/account-lifecycle.ts` (export inclut `stripeSubscriptions`, `stripeCustomers`, `stripeWebhookEvents`). Docs : `docs/plans.md`, `docs/database.md`, `docs/errors.md`, `docs/organizations.md`, `docs/release-checklist.md`, `README.md`, `DEPLOYMENT.md`, `apps/admin/README.md` | Secrets, URLs publiques et cycles de vie nommés Stripe | Env `FAPSHI_*` (apiuser/apikey/secret webhook), URLs publiques inchangées, effacement générique | Effacement : couverture des nouveaux champs ; env : migration documentée | Bascule → Contract | Un effacement supprime toute donnée de paiement personnelle, y compris hors registre |

## 7. Paiement — Fapshi (dossier)

Objectif des lots suivants : abstraction générique (`src/config/payments.ts` +
adapter dans `src/services/payments/`, sur le modèle `StorageAdapter`/
`getStorageAdapter()`), Fapshi en premier fournisseur, puis contraction de
Stripe selon le tableau §6.

Faits vérifiés sur sources officielles (11/08/2026) :

- Auth : headers `apiuser` + `apikey`. Sandbox `https://sandbox.fapshi.com`,
  live `https://live.fapshi.com`. Erreurs courantes : 400, 403, 404, 429.
  L'IP-whitelisting du dashboard ne s'applique qu'à la création de transaction.
- `POST /initiate-pay` — `amount` entier, minimum 100 XAF ; `externalId` optionnel
  (1–100 chars, `[a-zA-Z0-9\-_]`), décrit par Fapshi comme « Transaction/order ID
  for reconciliation » ; `userId` (même contrainte) ; réponse
  `{message, link, transId, dateInitiated}` ; **le lien expire après 24 h** et
  aucun paiement n'est possible après SUCCESSFUL ou EXPIRED.
- **`transId` ≠ `externalId`** : `transId` est l'identifiant de transaction
  Fapshi (retourné par initiate-pay, porté par le webhook et le statut) ;
  `externalId` est la référence métier locale. Conception retenue :
  `externalId` doit être une référence déterministe dérivée de `order_no`,
  ré-émise telle quelle en cas de retry, mais normalisée au contrat Fapshi
  `[a-zA-Z0-9_-]` et limitée à 100 caractères. Les `order_no` historiques qui
  contiennent `:` ou un autre caractère hors contrat ne doivent donc pas être
  envoyés bruts ; `transId` est stocké sur l'ordre.
- `GET /payment-status/{transId}` — statuts `CREATED`, `PENDING`, `SUCCESSFUL`,
  `FAILED`, `EXPIRED` ; **au plus 6 requêtes/minute par transId** (429 au-delà).
  La doc officielle recommande explicitement les webhooks plutôt que le polling.
- **Webhook** — POST vers l'URL configurée au dashboard à chaque changement de
  statut (SUCCESSFUL, FAILED, EXPIRED). Le payload est le corps de réponse de
  payment-status (inclut `transId`, `status`, `externalId`, `amount`, `medium`).
  **Sécurité :** `x-wh-secret` est un secret statique partagé comparé en clair —
  **pas une signature cryptographique** (pas de HMAC documenté) ; le dashboard ne
  permet pas de vérifier si un secret est déjà posé.
- **Livraison :** la doc indique que Fapshi envoie **une seule requête webhook par
  événement** (« regardless of whether your server responds or not »). Cette
  unicité n'est pas une garantie de livraison de bout en bout (réseau, temps
  d'arrêt, timeout) : **le traitement doit être conçu rejouable et idempotent**,
  clé = `externalId` + statut, avec dédupe (le modèle actuel
  `stripeWebhookEvents` fait déjà cela par `event_id` et sert de modèle).
- **Vérification serveur :** avant tout crédit ou fulfillment, le statut doit
  être confirmé côté serveur via `GET /payment-status/{transId}` (reconnaissance
  du webhook seul insuffisante : secret statique, pas de signature).
- **Polling :** le polling aveugle n'est pas « peu coûteux » — il est limité à
  6 req/min/transId. Conception : webhook comme canal primaire, **réconciliation
  bornée** (fenêtre limitée, quota respecté, 429 géré) pour les transactions
  restées CREATED/PENDING à l'expiration du lien, et marquage des impayés.
- Sources : https://docs.fapshi.com/llms.txt ,
  https://docs.fapshi.com/en/api-reference/endpoint/initiate-pay ,
  https://docs.fapshi.com/en/api-reference/endpoint/webhook ,
  https://docs.fapshi.com/en/api-reference/endpoint/payment-status .

Le schéma actuel fournit déjà `orders.stripe_session_id/stripe_payment_intent_id/
stripe_charge_id` : la table générique devra porter `provider`, `provider_transaction_id`
(= `transId`), `provider_reference` (= `externalId`/`order_no`) — dans un lot
ultérieur, avec migration expand/contract.

## 8. Observabilité — Temps (livré et limites)

Sources officielles relues pour le lot livré :

- https://temps.sh/docs/deploy-nextjs
- https://temps.sh/docs/react-analytics-sdk
- https://temps.sh/docs/cron-jobs
- https://temps.sh/docs/environment-variables
- https://github.com/gotempsh/temps

### Livré dans le dépôt

- `next.config.ts` et `apps/admin/next.config.ts` activent tous deux
  `output: "standalone"`. Les commandes restent distinctes :
  `bun run build:web` et `bun run build:admin`.
- Web et admin exposent GET/HEAD `/api/health` comme liveness sans DB, auth,
  service, modèle ou i18n. Le `.temps.yaml` racine configure ce chemin pour le
  web et conserve le drain `/api/cron/jobs` toutes les cinq minutes. La route
  cron valide elle-même `Authorization: Bearer $CRON_SECRET`. `vercel.json` est
  conservé : aucun basculement d'hébergeur n'est affirmé.
- Le SDK `@temps-sdk/react-analytics` est épinglé à `0.0.4`. Il est activé par
  le groupe complet `TEMPS_API_KEY`, `NEXT_PUBLIC_PROJECT_SLUG` et
  `NEXT_PUBLIC_TEMPS_API_URL`. En production, le
  provider ne monte qu'après consentement explicite `analytics`, avec
  `basePath="/api/_temps"`, pageviews, page leave, Web Vitals et engagement ;
  `ignoreLocalhost={true}` et `enableSessionRecording={false}`. Le provider
  enveloppe l'application afin que ses hooks soient utilisables. Le passage de
  `CONSENT_VERSION` à 2 invalide
  les anciens cookies.
- Aucun `projectId`, `domain`, `identify`, événement custom, page data ou replay
  config n'est transmis. Temps prend la priorité sur GA en cas de configuration
  contradictoire ; Google Analytics reste disponible quand Temps est inactif.
  L'admin n'importe ni le SDK ni le provider.
- `/api/_temps` est same-origin : aucune origine CSP externe n'a été ajoutée.
  `TEMPS_API_KEY` reste server-only ; le slug projet et l'URL d'API sont
  publics par contrat SDK. Les tokens de plateforme et `OTEL_*` restent
  server-only.
- Les builds standalone et les smokes GET/HEAD locaux sont des preuves de
  compatibilité du dépôt, pas la preuve d'un déploiement distant.

### Configuration de déploiement

Créer deux projets Temps distincts depuis la racine du dépôt. Le projet web lit
le `.temps.yaml` racine et lance `bun run build:web`. Le projet admin est lui aussi
configuré depuis la racine, lance `bun run build:admin`, et n'a pas de
`.temps.yaml` séparé dans ce dépôt. La configuration distante de ce projet admin
reste à effectuer.

### Explicitement non livré

- Aucun déploiement Temps réel ni smoke distant n'a été exécuté.
- Le suivi d'erreurs Sentry-compatible est initialisé côté navigateur, Node.js
  et Edge lorsque Temps injecte `NEXT_PUBLIC_SENTRY_DSN`. Le DSN n'est jamais
  codé en dur. Les replays masquent tout le texte et bloquent les médias.
  OpenTelemetry reste à implémenter séparément.
- Le logger structuré ne transmet aucune erreur ou trace à un fournisseur.
- Fapshi n'est pas implémenté. GA et la déclaration cron Vercel ne sont pas
  supprimés ; leur retrait demande une bascule réelle et vérifiée.

## 9. Environnement ajouté par ce lot

| Variable | Requis | Notes |
| --- | --- | --- |
| `COUNTRY_DETECTION_HEADER` | non | Server-only. Une valeur hors liste fermée fait échouer `validateAppEnv()` ; absente = détection désactivée. |

Le lot régional ne modifie aucune migration de paiement, Stripe ou locale. Le
lot Temps ajoute le SDK analytics consent-gated et le suivi d'erreurs
Sentry-compatible ; il ne livre ni Fapshi, ni OpenTelemetry. La CSP autorise
uniquement l'origine extraite du DSN configuré.

## 10. Travail reporté (lots suivants)

1. Déploiement Temps réel des deux projets, configuration distante de l'admin
   depuis la racine et smokes distants web/admin.
2. Initialisation OpenTelemetry serveur, avec redaction et no-op explicite
   vérifié hors Temps.
3. Adaptateur générique de paiement + fournisseur Fapshi (`externalId=order_no`,
   webhook idempotent, statut serveur vérifié, réconciliation bornée).
4. Contraction de Stripe selon §6, via migrations expand/contract.
5. Suppression de Google Analytics et de `vercel.json` seulement après une
   bascule Temps réelle, observée et réversible.
6. Classification opérateur MTN/Orange si l'expérience Fapshi l'exige.
