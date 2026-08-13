# Step 01: Analyze

**Task:** Standalone web output with exact acceptance from 02a
**Started:** 2026-08-13T11:51:05Z

---

## Context Discovery

_Findings will be appended here as exploration progresses..._

## Findings

### Files and current contracts

- `next.config.ts:1-15` exports a `withNextIntl(nextConfig)` wrapper. The config currently has `experimental.optimizePackageImports: ["sonner"]` at lines 7-9 and an async `headers()` hook at lines 10-12; no `output` property exists.
- `src/app/api/health/route.ts:1-19` is a minimal public liveness route. `GET` returns a `NextResponse.json` object with `status`, ISO `timestamp`, and `environment` (lines 4-10). `HEAD` returns status 200 and `x-service-status: ok` without a body (lines 12-19). Its only import is `next/server` (line 1).
- `package.json:10-23` exposes separate `build:web` (`next build`), `build:admin` (`next build apps/admin`), and lint commands; `package.json:29-42` pins Next 15.5.22 and the existing app dependencies.
- `tests/README.md` defines unit tests as no-I/O/no-mock tests and requires tests to live under `tests/`, while static architecture checks are in `tests/unit/architecture.test.ts`.
- `docs/african-baseline.md` §8 (around the deployment/health subsection) records that standalone output is absent in both configs, that `/api/health` is intended as a public dependency-free liveness endpoint, and that web/admin builds are separate.

### Existing tests and repository state

- No existing test or source file statically asserts `output: "standalone"` in the web config (search found no such literal).
- `git status --short` showed pre-existing regional-foundation modifications/untracked files, including protected schema/auth/migration metadata; this mission must preserve them. The branch is non-main: `feat/african-regional-foundations`.
- `git diff` for `next.config.ts` and the health route was empty, and recent history for those paths ends at `61e0d97`, `2140a98`, `5f2b672`, `7d6cb3c`, and `a053238`.
- Protected SHA-256 baselines are stored in `protected-hashes.initial`; files include schema, auth, migration journal/snapshots 0030/0031, and `bun.lock`.

### Acceptance criteria inferred from the mission prompt

- [ ] Add only `output: "standalone"` to the web Next config while retaining the existing wrapper, package imports, and headers hook.
- [ ] Leave the web health route unchanged.
- [ ] Add a focused static config test only because no existing proof was found.
- [ ] Typecheck, web lint, web build, actual standalone server GET/HEAD smoke, process cleanup, diff check, protected hashes, and status are recorded.

No implementation approach is selected in this analysis step.
