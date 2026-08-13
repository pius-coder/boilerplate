# Step 07: Tests

**Task:** Mission corrective Agent 01 — Terminer réellement les fondations régionales (reprise APEX, -a -s -e -x -t -b -PR)
**Started:** 2026-08-11T17:20:00Z (reprise)

---

## Test Analysis and Creation

**Stratégie (économie, step-00b-economy) :** tests ciblés ajoutés aux fichiers
existants en suivant les patterns du dépôt (`tests/unit/`, alias `@/`,
`vi.stubEnv` + `loadEnvModule` pour l'env). Aucun test n'asserte d'espace
Unicode runtime-dépendant (assertions par contenu numérique uniquement).

### Tests créés/modifiés pour les corrections

**`tests/unit/money.test.ts`** (18 tests, +12 vs lot initial) :

- `resolveCurrencyExponent` : XAF/xaf → 0, JPY → 0, USD/EUR → 2, KWD → 3 ;
  rejets `US`, `""`, `USDD`, `1`, `null`.
- `minorUnitsToDecimalString` : 1099/2 → `"10.99"`, 5/2 → `"0.05"`, 0/2 →
  `"0.00"`, -1099/2 → `"-10.99"`, 1500/0 → `"1500"`,
  MAX_SAFE/2 → `"90071992547409.91"` ; rejets unsafe/invalides.
- `formatMinorUnits` :
  - 1099 USD → contient `10.99`, **jamais** `1099.00` ; exposant explicite 2
    ≡ table ;
  - XAF 1500 → contient `1,500`, ni `.00` ni `,00` ; exposant 0 ≡ table ;
  - zéro (0.00), négatif (≠ positif, contient 10.99), limite sûre
    (MAX_SAFE → `90071992547409.91` après filtrage des non-chiffres) ;
  - rejets 1.5 / NaN / MAX+1 / devise `US` / exposants -1 et 10.
- Tests existants conservés (parse décimal, séparateurs, limites).

**`tests/unit/env.test.ts`** (+3 tests) :

- absence de `COUNTRY_DETECTION_HEADER` → `undefined` (détection désactivée) ;
- les 4 valeurs autorisées (`cf-ipcountry`, `x-vercel-ip-country`,
  `cloudfront-viewer-country`, `x-country-code`, testées en majuscules →
  normalisées) ;
- valeur invalide (`x-real-ip`) → `EnvValidationError` avec message citant la
  liste fermée et issue référençant la variable.
- `COUNTRY_DETECTION_HEADER` ajouté à `ENV_KEYS` (nettoyage entre tests).

### Tests existants revalidés (lot initial)

`tests/unit/regions.test.ts` (4), `tests/unit/phone-number.test.ts` (3),
`tests/unit/country-context.test.ts` (10), `tests/unit/architecture.test.ts`
(35 — règles : middleware sans services/models/db/getAppEnv/fetch ;
`NEXT_PUBLIC_COUNTRY|REGION` interdit) — passent sans modification.

### Exigence minimale 3.1 (traçabilité)

- `1099` USD exp 2 ⇢ `10.99`, jamais `1099.00` ✓ (test dédié)
- XAF sans décimales ✓ (test dédié)
- zéro, négatif, limites sûres ✓ (test dédié)
- aucune assertion sur espace Unicode ✓ (contenu numérique uniquement)

### Contrôle final après résolution

- `tests/unit/money.test.ts` : **19 tests**, ajout du cas CLF à 4 décimales.
- `pnpm exec tsc --noEmit` : exit 0.
- Aucun nouveau test DB/Redis requis pour ces utilitaires purs et la
  documentation ; les tests hermétiques restent la tier autorisée pour ce lot.

---
## Step Complete
**Status:** ✓ Complete
**Tests créés/modifiés:** 1 nouveau cas monétaire, suite totale ciblée 95 tests
**Timestamp:** 2026-08-11T17:55:00Z
