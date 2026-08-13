# Step 02: Plan

**Task:** Mission Agent 01 — Fondations régionales et dossier de transformation (African boilerplate regional foundations batch)
**Started:** 2026-08-11T15:27:53Z

---

## Planning Progress

_Implementation plan will be written here..._
# Step 02: Plan

## Implementation Plan: African regional foundations (batch 1)

### Overview
Add a centralized Cameroon region profile (`config/regions.ts`), pure money/phone utilities (`lib/money.ts`, `lib/phone-number.ts`), and a cookie→proxy→default country resolution in the middleware via new `config/country-context.ts` + `lib/country-context.ts`. Then write `docs/african-baseline.md` (Fapshi/payment + Temps/observability engineering decisions). No schema change, no new packages, no Stripe/Temps integration.

### New files

#### `src/config/regions.ts`
- Export `RegionCode` (string union, starts `"CM"`), `CurrencyCode` (`"XAF"`), `RegionProfile` interface: `code`, `name`, `currency`, `currencyExponent`, `callingCode`, `timeZone`, `mobileNumberPattern` (RegExp), `suggestedLocales` (`readonly string[]` = `["fr","en"]`, metadata only).
- Export `REGION_PROFILES: Record<RegionCode, RegionProfile>` with CM: `CM / XAF / 0 / +237 / Africa/Douala / /^6\d{8}$/`.
- Export `DEFAULT_REGION_CODE = "CM"`, `getRegionProfile(code?)` (trim/uppercase, unknown→default).
- NO imports (no i18n, no services/models/db). Do NOT own active locales, payment provider, prices.

#### `src/lib/money.ts`
- `isSafeMinorUnits(value)` — finite integer within `Number.MAX_SAFE_INTEGER`.
- `minorUnitsFromDecimal(input: string, exponent: number)` — BigInt-based (NO float math); rejects scientific notation, `NaN`/`Infinity`, `+` prefix, both separators present, multiple separators, separator without digits on both sides, more fraction digits than exponent, result beyond MAX_SAFE_INTEGER.
- `formatMinorUnits(amount, currency, locale)` — validates integer, formats via `Intl.NumberFormat` `{style:"currency", currency, currencyDisplay:"narrowSymbol"}`.
- No credits/orders/provider knowledge. Throws `RangeError`/`TypeError`.

#### `src/lib/phone-number.ts`
- Export `PhoneProfile` structural type: `{ callingCode: string; mobileNumberPattern: RegExp }`.
- `normalizePhoneNumber(input: string, profile: PhoneProfile)` — strip spaces/hyphens/parens; accept `6XXXXXXXX`, `2376XXXXXXXX`, `+2376XXXXXXXX`; validate national against profile pattern; return E.164 `+2376XXXXXXXX`. Reject letters, extensions, wrong lengths, foreign prefixes, non-matching nationals.

#### `src/config/country-context.ts`
- `COUNTRY_PREFERENCE_COOKIE = "app_country"`, `COUNTRY_HEADER = "x-app-country"`.
- `SUPPORTED_COUNTRY_DETECTION_HEADERS` closed list (`cf-ipcountry`, `x-vercel-ip-country`, `cloudfront-viewer-country`, `x-country-code`).
- `resolveCountryDetectionHeader(value?)` — pure; returns normalized name if in closed list else null (detection disabled by default).

#### `src/lib/country-context.ts`
- `normalizeCountryCode(value, supportedCodes)` — trim/uppercase/validate → code or null.
- `parseCountryCookie(cookieHeader)` — extract `app_country` value from a Cookie header.
- `resolveCountryContext({cookieHeader, geoHeaderName, geoHeaderValue, supportedCodes, defaultCode})` → `{code, source: "cookie"|"geo-header"|"default"}`: 1. valid cookie, 2. configured+valid geo header, 3. default.
- `applyCountryContext(requestHeaders, {cookieHeader, geoHeaderName, geoHeaderValue, supportedCodes, defaultCode})` — ALWAYS deletes incoming `x-app-country`, sets resolved internal value, returns code. (Pure Headers mutation so middleware behavior is unit-testable without importing Next middleware internals.)

### Modified files

#### `src/middleware.ts`
- Import `COUNTRY_HEADER` + `resolveCountryDetectionHeader` from `@/config/country-context`; `applyCountryContext` from `@/lib/country-context`; `REGION_PROFILES`/`DEFAULT_REGION_CODE` from `@/config/regions`.
- In `requestHeadersWithContext` (or middleware body, lines 71-87): after org context, call `applyCountryContext` with `request.headers.get("cookie")`, `resolveCountryDetectionHeader(process.env.COUNTRY_DETECTION_HEADER)` (per-request read; never `getAppEnv()` in middleware), geo value of configured header, supported codes, default. Mirror request-id: set `x-app-country` on API and page responses. No I/O, no fetch, no DB.

#### `src/lib/env.ts`
- Add `COUNTRY_DETECTION_HEADER` to `RawEnvSchema` (optional, `envString` — server-only, no NEXT_PUBLIC). Middleware must NOT use `getAppEnv()` (production validation requires Stripe etc.); it reads `process.env` directly.

#### `.env.example`
- Document `COUNTRY_DETECTION_HEADER=` with closed-list comment and the proxy obligation (CDN strips client value and writes its own).

#### `tests/unit/architecture.test.ts`
- New rule: `src/config/regions.ts`, `src/config/country-context.ts`, `src/lib/money.ts`, `src/lib/phone-number.ts`, `src/lib/country-context.ts`, `src/middleware.ts` must not import `@/services`, `@/models`, `@/db`, `@/app`; middleware must not `fetch(`.
- New rule: `NEXT_PUBLIC_COUNTRY` must not appear in source (server-only var).

### New tests (`tests/unit/`)
- `regions.test.ts` — CM profile consistency (default code, XAF, exponent 0, +237, tz, pattern), suggested locales only fr/en, normalization + fallback.
- `money.test.ts` — format fr/en XAF (compare digit sequences + presence of currency token, NO exact-unicode assumptions), zero/negative/safe-large, parse limits, rejections (XAF decimals, scientific, ambiguous separators, over-precision, MAX_SAFE_INTEGER overflow).
- `phone-number.test.ts` — 3 CM forms, presentation chars, E.164 output, rejections (letters, extension, wrong length, foreign prefix, non-matching national).
- `country-context.test.ts` — cookie→geo→default priority, spoofed `x-app-country` stripped, geo ignored when unconfigured, unknown→default, cookie parsing.

### New doc
- `docs/african-baseline.md` — payment/Fapshi section (Stripe field+path map, generic fields+backfill, preserved invariants from commits, initiate-pay contract, expand→contract) + Temps section (standalone, /api/health, cron replacement, env vars, SENTRY_DSN rules, OTEL, react-analytics provider + consent + CONSENT_VERSION, no admin analytics, no replay, redaction, CSP, expected tests) with official links.
- `README.md` — one line added to Engineering documentation list.

### Testing strategy
- 4 new unit files + architecture additions; run `pnpm test:fast`, then `pnpm lint`. No network/db in tests.

### Acceptance Criteria Mapping
- AC1 → `src/config/regions.ts` + `tests/unit/regions.test.ts`
- AC2 → `src/lib/money.ts` + `tests/unit/money.test.ts`
- AC3 → `src/lib/phone-number.ts` + `tests/unit/phone-number.test.ts`
- AC4 → `src/config/country-context.ts`, `src/lib/country-context.ts`, `src/middleware.ts`, `src/lib/env.ts`, `.env.example` + `tests/unit/country-context.test.ts`
- AC5 → test files above + architecture.test.ts
- AC6 → `docs/african-baseline.md` + `README.md`
- AC7 → no schema/package/Stripe/Temps changes by construction; protected files untouched
- AC8 → `pnpm test:fast`, `pnpm lint`, `git diff --check`

### Risks
- Edge runtime env access in middleware: mitigated by default-off behavior + per-request read + Node middleware compatibility; documented.
- Intl variance across ICU builds: tests avoid exact spacing assertions.
- next-intl middleware import in tests: avoided (logic tested via pure `applyCountryContext`).
- Protected files (`src/db/schema.ts`, `src/lib/auth.ts`, migrations, `bun.lock`) never read-write touched; git diff checked at the end.

---
## Step Complete
**Status:** ✓ Complete
**Files planned:** 6 new + 5 modified
**Tests planned:** 4 new + architecture additions
**Next:** step-03-execute.md
