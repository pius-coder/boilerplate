# Step 01: Analyze

**Task:** Standalone admin and liveness with exact acceptance from 02b
**Started:** 2026-08-13T12:04:15Z

---

## Context Discovery

_Findings will be appended here as exploration progresses..._

## Findings

### Files and current contracts

- `apps/admin/next.config.ts:1-68` loads root env files through absolute paths (`lines 24-35`), derives admin auth URLs (`37-48`), and exports a typed `NextConfig` object (`50-66`) with `optimizePackageImports`, `pageExtensions`, and `headers()`/`securityHeadersRoute`; no `output` property exists.
- `apps/admin/app/layout.tsx:1-23` is the root admin layout and contains no API route or health behavior; it imports global CSS, metadata types, and the style preset only.
- `apps/admin/app/api/health/route.ts` does not currently exist. The web route at `src/app/api/health/route.ts:1-19` provides the reference GET/HEAD contract and only imports `next/server`.
- `apps/admin/README.md` documents the admin as an independently deployable app with `pnpm build:admin`/`pnpm start:admin`, a separate origin, shared auth/database secrets, and no analytics surface.
- `package.json:10-23` exposes `build:admin`, `lint:admin`, and root typecheck via the installed TypeScript binary. `vitest.config.mts:42-46` defines the `@admin` alias to `apps/admin`.

### Existing test patterns

- Admin API route tests under `tests/api/` import handlers through `@admin`, call real `Request`/`Response` contracts, and avoid mocking guard code when the route has none; `tests/api/admin.read-auth.test.ts:1-80` is the closest style reference.
- Unit static tests use `tests/unit/` and filesystem text reads in `tests/unit/architecture.test.ts:8-39`; Vitest's mocked project includes `tests/**/*.test.ts`.
- No admin health route/test or standalone assertion exists (search found no `output: "standalone"` and no admin `/api/health`).

### Repository and preservation state

- 02A proof is complete: all acceptance checkboxes are marked, required output files are populated, and its real web standalone smoke returned GET/HEAD 200 with port cleanup.
- Worktree is intentionally dirty on `feat/african-regional-foundations`; protected SHA-256 baseline is inherited from 02A.
- Search found no Temps SDK/config/import in admin or source.

### Acceptance criteria inferred

- [ ] Add only the admin standalone output property while preserving env loading, `securityHeadersRoute`, `pageExtensions`, and optimized imports.
- [ ] Add a public dependency-free admin GET/HEAD health route matching the web contract.
- [ ] Add focused route and static config tests using existing aliases/tiers, with no admin analytics.
- [ ] Typecheck, admin lint/build, real admin standalone GET/HEAD smoke on 3101, cleanup, diff/hashes/status are recorded.

No implementation decisions are made in this analysis step.
