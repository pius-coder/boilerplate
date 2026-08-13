# APEX Task: 01-african-regional-foundations

**Created:** 2026-08-11T15:27:53Z
**Task:** Mission Agent 01 — Fondations régionales et dossier de transformation (African boilerplate regional foundations batch)

---

## Configuration

| Flag | Value |
|------|-------|
| Auto mode (`-a`) | true |
| Examine mode (`-x`) | true |
| Save mode (`-s`) | true |
| Test mode (`-t`) | true |
| Economy mode (`-e`) | true |
| Branch mode (`-b`) | true |
| PR mode (`-pr`) | false |
| Interactive mode (`-i`) | false |
| Branch name | feat/african-regional-foundations |

> **Correction consignée (reprise du 2026-08-11) :** l'état restauré enregistrait
> `economy_mode=false`, alors que `-e` est obligatoire pour cette mission. La
> valeur est corrigée à `true` ici. Overrides économie appliqués
> (step-00b-economy.md) : aucun sous-agent (pas d'appel `Task`/subagent), outils
> directs (Glob/Grep/Read), recherches web limitées (2 utilisées), validation
> allégée, tests ciblés. Le présent lot est exécuté uniquement par l'agent
> principal.

---

## User Request

```
Reprise corrective APEX (intention) : /apex -r 01-african-regional-foundations -a -s -e -x -t -b -PR
Mission corrective Agent 01 — Terminer réellement les fondations régionales
(corrige money.ts générique, validation fermée COUNTRY_DETECTION_HEADER,
dossier african-baseline.md factuel + cartographie Stripe AC6, étapes APEX 04-08 réelles)
```

---

## Acceptance Criteria

- [x] AC1: `src/config/regions.ts` exists with `RegionProfile`, `REGION_PROFILES`, `DEFAULT_REGION_CODE`, `getRegionProfile()`; Cameroon default: `CM`, `XAF`, exponent 0, `+237`, `Africa/Douala`, national mobile pattern; no I/O, no services/models/db imports; locale list NOT owned here; no prices/tiers/credits
- [x] AC2: `src/lib/money.ts` pure helpers — integer minor units only, `Intl.NumberFormat` formatting, XAF zero-decimal, decimal-string→minor conversion without float math, rejects NaN/scientific/ambiguous separators/over-precision/>MAX_SAFE_INTEGER; no credits/orders/provider knowledge
- [x] AC3: `src/lib/phone-number.ts` profile-driven normalization: accepts `6XXXXXXXX`, `2376XXXXXXXX`, `+2376XXXXXXXX` (+ reasonable spaces/dashes) → E.164 `+2376XXXXXXXX`; rejects letters/extensions/wrong lengths/foreign prefixes; no MTN/Orange classification; no OTP/SMS/WhatsApp
- [x] AC4: `src/config/country-context.ts` + `src/lib/country-context.ts` + extended `src/middleware.ts`; resolution order cookie → configured proxy header → default `CM`; `COUNTRY_DETECTION_HEADER` server-only env with closed list of supported names; middleware strips incoming `x-app-country` then writes internal value; no DB/network in middleware; unknown country → `CM`; header detection off by default
- [x] AC5: unit tests cover profile consistency, XAF formatting fr/en, zero/negative/safe-large/limits, decimal rejection, scientific/separator rejection, three CM forms, invalid/foreign rejection, cookie→proxy→default priority, spoofed header stripping, unconfigured geo header ignored, unknown→default, and no services/models/db imports from new config/lib modules
- [x] AC6: `docs/african-baseline.md` exists — Fapshi/generic payment plan (field mapping, generic fields, backfill, preserved invariants, initiate-pay specifics, expand→contract), Temps deploy/observability plan (standalone, /api/health, cron replacement, env vars, SENTRY_DSN server-only, OTEL optional, react-analytics provider, consent gating + CONSENT_VERSION bump, no admin analytics, no session replay, redaction, CSP, expected tests) with official doc links
- [x] AC7: no schema/migration change, no Stripe removal, no new packages, no instrumentation/consent/CSP changes, no locale removal, no commit/push/PR; protected MFA files byte-identical
- [x] AC8: `pnpm test:fast`, targeted new tests, `pnpm lint` pass; `git status`/`git diff --check` clean of whitespace errors

---

## Progress

| Step | Status | Timestamp |
|------|--------|-----------|
| 00-init | ✓ Complete | 2026-08-11T17:56:00Z |
| 01-analyze | ✓ Complete | 2026-08-11T15:37:38Z |
| 02-plan | ✓ Complete | 2026-08-11T15:39:52Z |
| 03-execute | ✓ Complete | 2026-08-11T15:53:29Z |
| 04-validate | ✓ Complete | 2026-08-11T17:56:00Z |
| 05-examine | ✓ Complete | 2026-08-11T17:56:00Z |
| 06-resolve | ✓ Complete | 2026-08-11T17:56:00Z |
| 07-tests | ✓ Complete | 2026-08-11T17:56:00Z |
| 08-run-tests | ✓ Complete | 2026-08-11T17:56:00Z |
| 09-finish | ⏭ Skip | |
