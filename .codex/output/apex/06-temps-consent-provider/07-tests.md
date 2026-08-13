# Step 07: Tests

**Task:** Provider Temps soumis au consentement
**Started:** 2026-08-13T13:35:10Z

---

## Test Analysis and Creation

_Test strategy and implementation will be documented here..._

## Test Analysis
The new component suite mocks the SDK boundary and exercises the real consent provider/cookie state. Eight cases cover flag absence, development and test modes, missing and refused consent, exact production props, withdrawal, and GA conflict. Pure consent tests pin version 1 rejection/version 2 serialization, while architecture tests pin location/useConsent/admin isolation. No network is possible through the mocked SDK.
