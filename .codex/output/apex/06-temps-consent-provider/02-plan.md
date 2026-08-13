# Step 02: Plan

**Task:** Provider Temps soumis au consentement
**Started:** 2026-08-13T13:35:10Z

---

## Planning Progress

_Implementation plan will be written here..._

## Implementation Plan

### `src/providers/temps-analytics.tsx` (new)
- Add the named client component using `useConsent()` and `hasTempsAnalytics()`.
- Return null unless production, the public flag is active, and analytics consent is explicitly allowed.
- Only then mount `TempsAnalyticsProvider` with `basePath="/api/_temps"`, `disabled={false}`, `ignoreLocalhost={true}`, and `enableSessionRecording={false}`; supply no identity, project, domain, event, page, or replay configuration.

### `src/providers/theme.tsx`
- Import and render `TempsAnalytics` adjacent to Google Analytics, inside the existing `ConsentProvider`.

### `src/providers/google-analytics.tsx`
- Import `hasTempsAnalytics()` and fail closed before mounting Google whenever Temps is active, preventing double tracking even when both public settings are present.

### `src/lib/consent.ts`
- Bump only `CONSENT_VERSION` from 1 to 2; preserve categories and serialization shape.

### `tests/components/temps-analytics.test.tsx` (new)
- Mock the external Temps SDK and Next Google provider, while exercising the real consent context and cookie functions.
- Cover unset flag, non-production, absent/refused consent, accepted consent with exact props, withdrawal/unmount, replay/project-ID absence, and Temps precedence over GA.

### `tests/unit/consent.test.ts`
- Make the v1 rejection and v2 serialized round-trip explicit.

### `tests/unit/architecture.test.ts`
- Name the Temps provider in the consent gate assertion, require it under `src/providers/`, and scan all admin TypeScript sources for SDK/import/component references.

### Validation
- Run targeted component/unit/architecture tests, typecheck, lint, fast suite, diff check, protected hashes, and status.
- Conduct the requested adversarial search for pre-consent effects, duplicate analytics, replay defaults, transmitted identity/secrets, and admin imports; resolve medium/high findings and replay validations.

### Acceptance mapping
All requested provider behavior is pinned by the provider/component test; consent-version behavior by the pure unit test; location/admin boundaries by architecture tests; cumulative command gates establish integration safety.
