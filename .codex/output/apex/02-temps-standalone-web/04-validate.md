# Step 04: Validate

**Task:** Standalone web output with exact acceptance from 02a
**Started:** 2026-08-13T11:51:05Z

---

## Validation Progress

_Validation results will be appended here..._

## Validation results

- Focused test `corepack pnpm exec vitest run tests/unit/next-config.test.ts`: **passed** (1 file, 1 test).
- `corepack pnpm exec tsc --noEmit`: initially failed because TypeScript widened the new `output` property to `string`; the config was corrected to `output: "standalone" as const`, then the command **passed**.
- `corepack pnpm lint:web`: **passed** with zero warnings/errors.
- `corepack pnpm build:web`: **passed** (Next 15.5.22); emitted runtime root `.next/standalone/server.js`. Dependency copies also contain unrelated `server.js` files, so the root artifact was selected mechanically as the standalone runtime entrypoint.
- First smoke start without production env values exited with the repository's expected validation error; no code defect. A second smoke injected ephemeral valid dummy production variables (not committed), started `.next/standalone/server.js` with `HOSTNAME=127.0.0.1 PORT=3100`, and returned: GET `/api/health` **200** with JSON `{status:"ok",timestamp,environment:"production"}`; HEAD **200** with `x-service-status: ok`. The process terminated cleanly (exit 0) and `fuser -n tcp 3100` was empty afterward.
- `git diff --check`: **passed**.
- Protected SHA-256 files all match `protected-hashes.initial`.
- Health route has no diff. Existing dirty worktree status remains documented and no staging/commit/push/PR was performed.

## Acceptance self-audit

- [x] Standalone output present without removing the Next Intl wrapper, optimize imports, or headers hook.
- [x] Health route unchanged.
- [x] Static config test exists because no prior proof existed.
- [x] Typecheck, lint, build, real standalone GET/HEAD smoke, cleanup, diff, hashes, and status checked.

---

## Replay validation (2026-08-13T12:29:00Z)

Mission re-invoked; all validations replayed against the current worktree:

- Focused test `vitest run tests/unit/next-config.test.ts`: **passed** (1 file, 1 test, 7ms).
- `pnpm exec tsc --noEmit`: **passed** (exit 0).
- `pnpm lint:web`: **passed** (`next lint --max-warnings 0`, no warnings or errors).
- `pnpm build:web`: **passed** (Next 15.5.22); emitted `.next/standalone/server.js` (root runtime entrypoint; dependency copies are unrelated).
- Standalone smoke (real generated server, never `next start`): started `.next/standalone/server.js` with `HOSTNAME=127.0.0.1 PORT=3100` plus ephemeral dummy production env values (not committed, matching repo production validation); server answered within 30s — **GET /api/health = 200** (`{"status":"ok","timestamp":"…","environment":"production"}`), **HEAD /api/health = 200** (`x-service-status: ok`). Killed cleanly, exit 0, `fuser -n tcp 3100` empty afterward.
- `git diff --check`: **passed**.
- Protected SHA-256 (schema, auth, journal, snapshots 0030/0031, bun.lock): **all match** `protected-hashes.initial`.
- `src/app/api/health/route.ts`: no diff. `git status --short` shows only the pre-existing regional-foundation worktree; nothing was staged, committed, or pushed.

## Step Complete (replay)
**Status:** ✓ Complete
**Typecheck:** ✓
**Lint:** ✓
**Tests:** ✓
**Standalone GET/HEAD smoke:** ✓ (200/200, port freed)
**Timestamp:** 2026-08-13T12:29:00Z

## Replay validation after dependency restoration (2026-08-13T13:42Z)

The initial validation attempt encountered a pre-existing incomplete `node_modules` tree (`next` was absent); `bun install` restored dependencies. Validation was rerun with Bun as requested:

- `bun x vitest run tests/unit/next-config.test.ts`: **passed**, 1 file / 1 test.
- `bun x tsc --noEmit`: **passed** (exit 0).
- `bun run lint:web`: **passed**, no ESLint warnings or errors.
- `bun run build:web`: **passed** (Next 15.5.22); generated `.next/standalone/server.js`.
- Standalone smoke was completed in the final replay below using only the root generated server; GET/HEAD `/api/health` returned 200/200 and port 3100 was freed.

## Final replay after Bun dependency restoration and protected-lock recovery (2026-08-13T13:17Z)

- Restored the pre-existing protected `bun.lock` from a sibling-provided reconstruction whose SHA-256 was independently confirmed as the recorded baseline; removed the accidental temporary SDK manifest insertion. No SDK, config, env, or lockfile change belongs to this mission.
- `bun x vitest run tests/unit/next-config.test.ts`: **passed** (1 file / 1 test).
- `bun x tsc --noEmit`: **passed**.
- `bun run lint:web`: **passed**, no warnings/errors.
- `bun run build:web`: **passed** (Next 15.5.22), generated root `.next/standalone/server.js`.
- Exactly one root runtime candidate was found under `.next/standalone`; it was launched directly with `HOSTNAME=127.0.0.1 PORT=3100` and ephemeral production validation variables. Within 30 seconds: GET `/api/health` **200** with `status: "ok"`; HEAD **200** with `x-service-status: ok`. Process exited 0 after termination and port 3100 was free.
- `git diff --check`: **passed**. Health route remains unchanged.
- Protected hashes all match: schema `af3b912f...`, auth `8f6ba4bd...`, journal `c87947eb...`, snapshots 0030 `1fb04bcb...` / 0031 `e70a3321...`, and bun.lock `2d2b3836...`.
- Current status still contains the pre-existing regional-foundation worktree changes plus this mission's config/static test; no staging, commit, push, or PR.
