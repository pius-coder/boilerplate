# Step 01: Analyze

**Task:** Mission Agent 01 — Fondations régionales et dossier de transformation (African boilerplate regional foundations batch)
**Started:** 2026-08-11T15:27:53Z

---

## Context Discovery

### Mandated docs read
- `AGENTS.md`, `README.md`, `DEPLOYMENT.md`, `docs/database.md`, `docs/errors.md`, `docs/frontend.md`, `docs/legal.md`, `docs/plans.md`, `docs/security-headers.md`, `tests/README.md`, `apps/admin/README.md`
- Commits examined: `e38ac33` (horizontal layers), `5389f4d` (idempotent checkout intent), `43ed5b2` (central billing catalog), `c567cf9` (org-owned billing), `7c622fb` (atomic payment+grant), `35f6faf` (`action_required`), `bf14b1d` (reconciliation).

### Git state
- Branch: `feat/african-regional-foundations` (created from `main`, worktree untouched, nothing staged).
- Protected pre-existing changes (must NOT be touched): `src/db/schema.ts`, `src/lib/auth.ts`, `src/db/migrations/meta/_journal.json`, `0030_nervous_senator_kelly.sql`, `0031_lowly_the_hood.sql`, `0030/0031_snapshot.json`, `bun.lock`.

### Key files
| File | Notes |
|------|-------|
| `src/middleware.ts:71-87` | next-intl middleware; `requestHeadersWithContext` sets `x-request-id`, org headers; API routes bypass locale negotiation; matcher excludes `_next/_vercel/admin` |
| `src/config/organization-context.ts` | Pattern: config file holding header/query param names + pure normalizer. Model for `country-context` |
| `src/i18n/locale.ts` | `availableLocales = ["en","zh","es","fr","ja"]`; locales source of truth stays here |
| `src/lib/env.ts` | Zod env schema (`RawEnvSchema`), `validateAppEnv()`; `envBoolean`, `envString` helpers; `NEXT_PUBLIC_*` naming rule |
| `src/instrumentation.ts` | `register()` validates env in nodejs runtime — DO NOT change this lot |
| `next.config.ts` + `apps/admin/next.config.ts` | Both import `src/config/security-headers.js`; no `output` set yet (dossier documents adding `standalone`) |
| `src/config/security-headers.js` | CSP builder, report-only default, `extra` seam |
| `src/lib/consent.ts` | `CONSENT_VERSION = 1`, categories `analytics`/`advertising`, deny-by-default |
| `src/providers/consent.tsx` | `useConsent()` gate — dossier documents Temps analytics provider plan |
| `src/config/billing.ts` | Billing catalog — Stripe paths mapped in dossier, no change this lot |
| `src/services/checkout.ts`, `src/models/fulfillment.ts` | Idempotency keys, atomic grant, `action_required` invariants to preserve in Fapshi dossier |
| `src/lib/logger/request-id.ts` | `normalizeRequestId` — the model for how API routes receive request context (country header should flow the same way) |
| `.env.example` | Template for documenting `COUNTRY_DETECTION_HEADER` |
| `tests/unit/architecture.test.ts` | Layer rules: config may not import services/models/app; `lib/` must not know domain; kebab-case filenames |
| `vitest.config.mts` | `mocked` project = `tests/**/*.test.ts`; coverage ratchet lines 33/functions 51/branches 69 |
| `tests/unit/organization-context.test.ts` | Test pattern for transport-name config modules |

### External sources consulted (for `docs/african-baseline.md`)
- Temps deploy docs: `output: "standalone"` required before deploy or health check fails; links: https://temps.sh/docs/deploy-nextjs
- React analytics SDK: `@temps-sdk/react-analytics`, first-party `basePath="/api/_temps"` proxy pattern confirmed by Temps blog; prop names (`projectId`, `disabled`) NOT verifiable from compressed docs — the dossier must keep the verify-before-coding requirement (exactly as the mission states). Link: https://temps.sh/docs/react-analytics-sdk
- Fapshi llms.txt (https://docs.fapshi.com/llms.txt): auth `apiuser`/`apikey` headers; sandbox https://sandbox.fapshi.com, live https://live.fapshi.com; `POST /initiate-pay` with `amount` (integer, min 100 XAF), `externalId` (1-100 chars `[a-zA-Z0-9\-_]`), `email`, `redirectUrl`, `userId`, `message`; response `{message, link, transId, dateInitiated}`; links expire after 24h; statuses CREATED/PENDING/SUCCESSFUL/FAILED/EXPIRED; `GET /payment-status/{transId}` rate-limited 6 req/min; webhooks SUCCESSFUL/FAILED/EXPIRED with `x-wh-secret` header, one delivery per event (no retries documented) — server must answer fast (200).
- Temps env vars and cron: https://temps.sh/docs/environment-variables, https://temps.sh/docs/cron-jobs (linked in dossier, not verifiable content).

### No existing country/currency code
- grep for `country`, `XAF`, `237` in `src/` → only unrelated `src/config/legal.ts` mention. Greenfield.
