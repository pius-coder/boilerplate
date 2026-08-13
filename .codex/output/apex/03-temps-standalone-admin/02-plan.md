# Step 02: Plan

**Task:** Standalone admin and liveness with exact acceptance from 02b
**Started:** 2026-08-13T12:04:15Z

---

## Planning Progress

_Implementation plan will be written here..._

## Implementation Plan: Standalone admin and liveness

### Overview
Add the admin standalone output setting, create a dependency-free App Router health route matching the web contract, and cover both contracts with focused tests. Do not touch the web health route, Temps integration, admin layout, or any shared service/config.

### File changes

#### `apps/admin/next.config.ts`
- At the existing typed `nextConfig: NextConfig` object around lines 50-66, add `output: "standalone"`. Preserve absolute env loading, `securityHeadersRoute`, `pageExtensions`, and `experimental.optimizePackageImports`.

#### `apps/admin/app/api/health/route.ts` (new)
- Create a minimal route with only the `next/server` import.
- Implement GET returning `{ status: "ok", timestamp, environment }` with status 200.
- Implement HEAD returning status 200, empty body, and `x-service-status: ok`.
- Do not import auth, i18n, services, models, DB, or other application code.

#### `tests/api/admin-health.test.ts` (new)
- Import GET/HEAD from `@admin/app/api/health/route` using the configured admin alias.
- Assert the GET status/body/timestamp/environment and HEAD status/header/body.
- Read the route as text and assert no forbidden application-layer imports, keeping the liveness dependency boundary statically visible.

#### `tests/unit/admin-next-config.test.ts` (new)
- Read `apps/admin/next.config.ts` as text without importing/executing Next.
- Assert the standalone output literal is present.

### Testing strategy

- Run the two focused tests, then `pnpm exec tsc --noEmit` and `pnpm lint:admin`.
- Run `pnpm build:admin`, locate the root runtime `server.js` emitted under `apps/admin/.next/standalone` (record actual path), start it with `HOSTNAME=127.0.0.1 PORT=3101`, verify GET/HEAD `/api/health` status 200, terminate, and verify port cleanup.
- Run `git diff --check`, compare all protected hashes to 02A, and record status.

### Acceptance mapping

- AC1: `apps/admin/next.config.ts`; preservation reviewed by diff and build.
- AC2: new admin health route and route test.
- AC3: two focused tests in the route/unit tiers; no admin analytics files or imports.
- AC4: validation/smoke/preservation command logs.

### Risks and scope boundaries

- Standalone server startup may require ephemeral dummy production env values; provide them only to the smoke process, never commit them.
- Do not add `.temps.yaml`, SDK packages, providers, or workspace changes.
