# Step 05: Examine

**Task:** Mission corrective Agent 01 — Terminer réellement les fondations régionales (reprise APEX, -a -s -e -x -t -b -PR)
**Started:** 2026-08-11T17:28:00Z (reprise)

---

## Adversarial Review

**Mode :** auto-revue (économie, step-00b-economy — pas de sous-agent de revue).
Checklist : sécurité, logique/edge cases, qualité/patterns, documentation.

### Findings

| # | Sévérité | Fichier | Finding |
|---|---|---|---|
| F1 | LOW | `.env.example` | Le commentaire de `COUNTRY_DETECTION_HEADER` décrit l'opt-in mais pas le comportement fermé : une valeur hors liste échoue `validateAppEnv()` au boot. À préciser pour éviter qu'un opérateur ne découvre le comportement après un échec de déploiement. |
| F2 | LOW | `docs/african-baseline.md` §8 | Le wrapper `<TempsAnalyticsProvider>` est attribué aux docs officielles sans source précise. La page `react-analytics-sdk` était illisible ce jour ; le nom du composant vient du README officiel `github.com/gotempsh/temps`. Citer la source réelle et maintenir « contrat à vérifier ». |
| F3 | MEDIUM | `docs/african-baseline.md` §4 | Le middleware lit `process.env.COUNTRY_DETECTION_HEADER` sans `getAppEnv()` : une valeur invalide y est donc ignorée silencieusement (détection OFF), alors que `validateAppEnv()` échoue au boot. C'est le contrat voulu, mais le document doit l'énoncer explicitement, sinon un lecteur peut croire à une incohérence. |
| F4 | LOW | `src/lib/money.ts` | `formatMinorUnits(amount, currency, locale, exponent)` avec exposant explicite et devise invalide (ex. `"US"`) lève le `RangeError` au moment du `Intl.NumberFormat` (option currency), pas dans `resolveCurrencyExponent`. Même type d'erreur, message diffèrent — comportement acceptable (échec explicite). |
| F5 | LOW | `src/lib/money.ts` | Ordre des gardes : le paramètre par défaut `exponent = resolveCurrencyExponent(currency)` est évalué avant le corps ; `formatMinorUnits(MAX+1, "US", "en-US")` lève l'erreur de devise plutôt que l'erreur de montant. Sans conséquence (même type d'erreur). |
| F6 | LOW | `src/lib/money.ts` | `-0` : `amount < 0` est faux, rendu `"0"` — aucun `"-0"` possible. Aucun correctif. |

### Éléments relus et validés

- `envCountryDetectionHeader` : symétrique de `envStorageProvider` (transform +
  `ctx.addIssue` + `z.NEVER`), liste fermée importée (pas de duplication de
  constante), absence/`""` → `undefined`.
- Pas de cycle d'imports (`src/config/country-context.ts` n'importe rien) ;
  `lib/` → `config/` déjà pratiqué par `src/lib/auth.ts`.
- `src/middleware.ts` : aucun `getAppEnv()`, aucun `fetch`, aucun import
  services/models/db (règle architecture test vérifiée — 35 tests passent).
- `formatMinorUnits` : chemin de formatage sans float (chaîne BigInt → Intl).
- Tests : aucune assertion sur des espaces Unicode ; assertions par contenu
  numérique.

### Reprise de contrôle finale (11/08/2026)

| # | Sévérité | Finding | Résolution |
|---|---|---|---|
| H1 | HIGH | `money.ts` ne passait pas `tsc` : BigInt literal incompatible ES2017 et chaîne non assignable à `Intl.NumberFormat.format`. | Corrigé : `BigInt(10)` et conversion typée d'une chaîne décimale produite localement. |
| H2 | MEDIUM | Le fallback d'exposant ne couvrait pas les devises à 4 décimales (`CLF`, `UYW`) et sa documentation prétendait couvrir tous les exposants. | Corrigé : exceptions 4 décimales ajoutées, `MGA` aligné sur le runtime, commentaire rendu précis, tests ajoutés. |
| M1 | MEDIUM | Le dossier Temps était incomplet et conservait des affirmations « page illisible » alors que le contrat officiel du provider est lisible. | Corrigé : §8 réécrit avec health check `/api/health`, builds web/admin, cron, variables, CSP, redaction, consent et props officielles. |
| M2 | MEDIUM | Le tableau de progression `00-context.md` n'était pas synchronisé avec les step files remplis. | Corrigé après validation finale par `update-progress.sh`. |

Les quatre findings de cette reprise sont résolus. `pnpm exec tsc --noEmit`, les
builds web/admin et les validations hermétiques passent.
