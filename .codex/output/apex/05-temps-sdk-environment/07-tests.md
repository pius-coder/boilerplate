# Step 07: Tests

**Task:** Temps SDK and environment exact acceptance from 02d
**Started:** 2026-08-13T12:18:39Z

---

## Test Analysis and Creation

⚡ ECONOMY MODE — 1 similar file read (`tests/unit/temps-config.test.ts` for config-test conventions; `env.test.ts` for env-schema conventions).

### Infrastructure
- Framework: Vitest, five tiers (`tests/unit` = hermetic mocked project, no infra).
- Command: `pnpm test:fast` (mocked + components); targeted: `pnpm vitest run --project mocked tests/...`.
- Conventions: `tests/` mirrors source tree; env tests stub `process.env` via `vi.stubEnv` + `loadEnvModule()` (resetModules + resetEnvCacheForTests); pure config tests delete env keys in beforeEach, `vi.unstubAllEnvs()` in afterEach.

### Tests created (mission items 1-3 of "Tests et validation")

1. **`tests/unit/env.test.ts`** (extended, +6 tests → 32 total):
   - `NEXT_PUBLIC_TEMPS_ANALYTICS_ENABLED` added to `ENV_KEYS` (cleared per-test).
   - default false outside production;
   - every true form (`1`, `true`, `yes`, `on`, whitespace/case variants) parsed true;
   - every false form (`0`, `false`, `no`, `off`) parsed false;
   - invalid value (`enabled`) rejected with env issue;
   - production without the flag passes (never required);
   - GA+Temps conflict → `EnvValidationError` ("Invalid configuration", both names in issues);
   - GA alone with Temps off still valid.

2. **`tests/unit/analytics-config.test.ts`** (NEW, 9 tests) — pure helpers with literal env access:
   - `hasTempsAnalytics`: false when unset/empty; true for 1/true/yes/on (trim+case); false for 0/false/no/off/garbage;
   - `hasAnalytics`: false when no vendor; true for GA alone; true for Temps alone;
   - `hasConsentGatedScripts`: false when none; true for Temps; true for GA; `hasAdvertising` true with adcode and drives consent-gated.

3. **`tests/unit/architecture.test.ts`** (extended, +1 test → 36 total):
   - "keeps observability and analytics secrets out of the browser bundle" — forbids `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_TEMPS_API_TOKEN`, `NEXT_PUBLIC_TEMPS_API_URL`, `NEXT_PUBLIC_OTEL_*` across `src/` and `apps/admin/`; regex smoke-tested (no false positives on `NEXT_PUBLIC_TEMPS_ANALYTICS_ENABLED` or `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`).

### Coverage vs mission
- env: défaut false ✓, vraies valeurs ✓, fausses valeurs ✓, invalide rejetée ✓, conflit GA+Temps rejeté ✓, non-requise en prod ✓.
- purs: `hasTempsAnalytics` ✓, `hasAnalytics` ✓, consent-gated ✓.
- architecture: secrets publics interdits ✓.

---
## Step Complete
**Status:** ✓ Complete
**Tests created:** 16 new assertions (6 env + 9 analytics-config + 1 architecture)
**Test files:** 2 extended + 1 new
**Next:** step-08-run-tests.md
**Timestamp:** 2026-08-13
