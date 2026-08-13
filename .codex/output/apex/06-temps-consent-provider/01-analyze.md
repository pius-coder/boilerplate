# Step 01: Analyze

**Task:** Provider Temps soumis au consentement
**Started:** 2026-08-13T13:35:10Z

---

## Context Discovery

_Findings will be appended here as exploration progresses..._

## Codebase Context

### Related files
- `src/providers/theme.tsx:34-42` already places Google Analytics, Adsense and the cookie banner under `ConsentProvider`.
- `src/providers/google-analytics.tsx:17-34` is production-only, ID-gated and calls `useConsent().allows("analytics")`, but it does not yet yield priority to Temps.
- `src/config/analytics.ts:27-34` exposes `hasTempsAnalytics()` with an opt-in flag defaulting false.
- `src/lib/consent.ts:34-40` documents version invalidation; current `CONSENT_VERSION` is 1.
- `src/providers/consent.tsx` initializes consent to null and only reads the cookie in a mount effect; `allows` also requires `ready`, so consumers fail closed before hydration.
- `tests/unit/consent.test.ts` already covers stale cookies and current-version round trips generically.
- `tests/unit/architecture.test.ts:624-654` enforces `useConsent()` for shipped tracker providers, but currently names only Google Analytics and Adsense and scans only `src/`.
- No component analytics/consent test exists yet. The component project uses jsdom and supports module mocks via Vitest.
- `@temps-sdk/react-analytics@0.0.4` exports `TempsAnalyticsProvider`; its installed props include the requested `basePath`, `disabled`, `ignoreLocalhost`, and `enableSessionRecording`.

### Existing constraints and evidence
- Prior APEX tasks 02-05 exist and report standalone web/admin, health/cron, SDK/env tests green.
- Protected baseline hashes currently match: schema `af3b912f…`, auth `8f6ba4bd…`, journal `c87947eb…`, snapshots `1fb04bcb…`/`e70a3321…`, and `bun.lock` `2d2b3836…`.
- `package.json` pins the SDK exactly to `0.0.4`; the pnpm lock currently lacks the package (a cumulative-hardening finding for task 07, not this React-only task).
- No provider, route, CSP, instrumentation, or admin file currently imports the Temps analytics SDK.

## Inferred Acceptance Criteria
- [ ] Temps SDK provider is never mounted before explicit analytics consent and is production/flag gated.
- [ ] Mounted SDK receives only the exact safe four-prop contract, with replay explicitly false.
- [ ] Consent withdrawal unmounts it, and version 1 consent is invalidated by version 2.
- [ ] Temps takes priority over Google Analytics even under conflicting configuration.
- [ ] Architecture checks pin provider location/consent use and prohibit all admin imports.
- [ ] Component tests mock the SDK and cover every requested state transition without network access.
