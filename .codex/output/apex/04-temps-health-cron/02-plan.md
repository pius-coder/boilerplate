# Step 02: Plan

**Task:** Temps health and cron exact acceptance from 02c
**Started:** 2026-08-13T12:11:33Z

---

## Planning Progress

_Implementation plan will be written here..._

## Implementation Plan: Temps health and cron configuration

### Overview
Add the exact root Temps declaration as an additive hosting configuration, prove its important values with a filesystem-only unit test, and update only the deployment hosting text. Preserve Vercel and all runtime route/auth code.

### File changes

#### `.temps.yaml` (new)
- Write exactly the requested `health` block (`/api/health`, 200, interval 30, timeout 5, retries 3).
- Write exactly one `cron` entry for `/api/cron/jobs`, schedule `*/5 * * * *`, name `Drain application jobs`.
- Keep the file at repository root; do not add an admin copy.

#### `tests/unit/temps-config.test.ts` (new)
- Read `.temps.yaml` as plain text using Node fs/path APIs; do not add/import YAML parsing.
- Assert the health path/status/interval/timeout/retries and cron path/schedule/name literals.

#### `DEPLOYMENT.md`
- Modify only the existing hosting/deployment section around lines 238-270.
- Document that Temps reads root `.temps.yaml`, invokes the cron by GET with `Authorization: Bearer $CRON_SECRET`, and keeps web configuration repo-side.
- Document that admin requires a second Temps project configured from the repository root with `pnpm build:admin`; clearly state no real deployment has been verified.
- Leave environment, migration, Stripe, and checklist sections unchanged.

#### Unchanged files (explicit)
- `vercel.json`, `src/app/api/health/route.ts`, `src/app/api/cron/jobs/route.ts`, `src/lib/cron.ts`, and `tests/unit/cron.test.ts` remain unchanged; their existing contracts are validated by diff and tests.

### Testing strategy

- Run `tests/unit/temps-config.test.ts` and `tests/unit/cron.test.ts` as focused tests.
- Run `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm test:fast`; do not run builds in this mission.
- Run `git diff --check`, compare `vercel.json` to its preflight hash/content, verify protected hashes, and record status.

### Acceptance mapping

- AC1: exact `.temps.yaml`.
- AC2: unchanged Vercel/runtime files and existing cron guard tests.
- AC3: static Temps test plus `cron.test.ts`.
- AC4: hosting-only docs edit.
- AC5: command/hash/status evidence.

### Risks and scope boundaries

- YAML indentation/quoting is part of the requested contract; test line-level values rather than introducing a parser.
- Do not claim a remote Temps deployment or alter admin hosting configuration.
