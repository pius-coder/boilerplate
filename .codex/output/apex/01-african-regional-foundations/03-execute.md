# Step 03: Execute

**Task:** Mission corrective Agent 01 — Terminer réellement les fondations régionales (reprise APEX, -a -s -e -x -t -b -PR)
**Started:** 2026-08-11T17:05:00Z (reprise)

---

## Implementation Log

### Corrections de la reprise (tout outils directs, économie)

1. **00-context.md — correction `economy_mode`** : état restauré à `false`,
   corrigé à `true` (exigence `-e`), correction consignée dans le fichier,
   overrides économie appliqués (aucun sous-agent). Baseline SHA-256 des
   fichiers protégés enregistrée (`/tmp/opencode/protected-baseline.sha256`).

2. **`src/lib/money.ts` (correction 3.1)** — formatage générique par devise :
   - `resolveCurrencyExponent(currency)` : table déterministe ISO 4217
     (XAF et zéro-décimales → 0, dinars du Golfe → 3, sinon 2 ; code non
     3 lettres → `RangeError`) ;
   - `minorUnitsToDecimalString(amount, exponent)` : conversion exacte en
     chaîne décimale via BigInt, sans virgule flottante ;
   - `formatMinorUnits(amount, currency, locale, exponent?)` : exposant
     optionnel (défaut = table), décimal passé en **chaîne** à
     `Intl.NumberFormat` (valeur mathématique exacte, aucun narrowing
     bigint→number) ; `isSafeMinorUnits` conservé comme garde.
   - Comportement XAF (exposant 0) inchangé : 1500 → « 1,500 » sans décimales.

3. **`src/lib/env.ts` (correction 3.2)** — `COUNTRY_DETECTION_HEADER` validé
   sur la liste fermée `SUPPORTED_COUNTRY_DETECTION_HEADERS` (importé depuis
   `@/config/country-context`) : absente/`undefined` = valide (détection
   désactivée) ; toute valeur hors liste → `EnvValidationError` au boot.
   Le middleware continue de lire `process.env` directement (contrat inchangé).

4. **Tests (corrections 3.1/3.2)** :
   - `tests/unit/money.test.ts` : suites `resolveCurrencyExponent`,
     `minorUnitsToDecimalString`, `formatMinorUnits` (1099 USD → 10.99 jamais
     1099.00 ; XAF sans décimales ; zéro/négatif/limite sûre ; aucune assertion
     sur des espaces Unicode runtime-dépendants — assertions par contenu
     numérique) ;
   - `tests/unit/env.test.ts` : +3 tests (absence = désactivé ; les 4 valeurs
     autorisées ; valeur invalide `x-real-ip` → échec explicite) ;
     `COUNTRY_DETECTION_HEADER` ajouté à `ENV_KEYS`.

5. **`docs/african-baseline.md` (correction 3.3)** — réécriture factuelle :
   - `transId` (Fapshi) vs `externalId` (référence métier portant `order_no`) ;
   - `x-wh-secret` = secret statique comparé en clair, pas une signature
     cryptographique ; unicité documentée de la requête webhook ≠ garantie de
     livraison → traitement rejouable et idempotent ; vérification serveur du
     statut avant crédit/fulfillment ; webhook primaire + réconciliation
     bornée (6 req/min/transId, 429 géré) ;
   - chemin réel du webhook Stripe : `src/app/api/pay/webhook/stripe/route.ts` ;
   - URLs Temps corrigées en `temps.sh/docs/*` ; `output: "standalone"` absent
     des deux `next.config.ts` (vérifié) ; logger ≠ transport vers Temps/Sentry
     (intégration explicite requise) ;
   - cartographie Stripe AC6 complète (§6, 10 groupes, chemins vérifiés,
     état/couplage/cible/backfill/phase/invariant).

Aucune migration, aucun package, aucune intégration Fapshi/Temps/Sentry/OTel,
aucune modification Stripe/consentement/CSP/locales, aucun commit/push/PR.
