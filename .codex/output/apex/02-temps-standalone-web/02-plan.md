# Step 02: Plan

**Task:** Standalone web output with exact acceptance from 02a
**Started:** 2026-08-13T11:51:05Z

---

## Planning Progress

_Implementation plan will be written here..._

## Implementation Plan: Standalone web output

### Overview
Make the smallest web-only configuration change, then add a hermetic static proof because analysis found no existing standalone assertion. Leave the existing health route and all unrelated pre-existing worktree changes untouched.

### File changes

#### `next.config.ts`
- At the existing `nextConfig` object around lines 6-13, add exactly `output: "standalone"` while preserving `experimental.optimizePackageImports`, `headers()`, and the `withNextIntl` export.

#### `tests/unit/next-config.test.ts` (new)
- Read the repository `next.config.ts` as text using Node filesystem/path APIs; do not import or execute Next config.
- Assert the standalone literal is present, providing the missing static regression proof. Keep it in the mocked/unit `.ts` project and avoid mocks or network calls.

### Testing strategy

- Run the focused static test.
- Run `pnpm exec tsc --noEmit` and `pnpm lint:web`.
- Run `pnpm build:web`, locate the single generated `.next/standalone/server.js`, launch it with `HOSTNAME=127.0.0.1 PORT=3100`, and verify GET/HEAD `/api/health` return 200; terminate and check port cleanup.
- Finish with `git diff --check`, protected SHA-256 comparison, and `git status --short`.

### Acceptance mapping

- AC1 config-only addition: `next.config.ts`.
- AC2 unchanged liveness contract: no health-route edit; standalone smoke proves it.
- AC3 static proof: `tests/unit/next-config.test.ts`.
- AC4 validation and preservation: commands and protected hash checks above.

### Scope and risks

- Do not add Temps config, SDK, copy scripts, env variables, or documentation in this mission.
- Existing dirty worktree files are out of scope and must remain byte-identical where protected.
