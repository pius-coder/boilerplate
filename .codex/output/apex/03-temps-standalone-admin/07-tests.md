# Step 07: Tests

**Task:** Standalone admin and liveness with exact acceptance from 02b
**Started:** 2026-08-13T12:04:15Z

---

## Test Analysis and Creation

_Test strategy and implementation will be documented here..._

## Test analysis

- Framework/config: Vitest 3.2.7 with mocked Node project for `.ts` tests; `@admin` alias resolves to `apps/admin` (`vitest.config.mts:42-46`).
- Existing admin route style inspected in `tests/api/admin.read-auth.test.ts`: direct handler calls with real Requests and status/body assertions. Existing static source style inspected in `tests/unit/architecture.test.ts`.
- `tests/api/admin-health.test.ts` is an API-tier contract test because it invokes real App Router handlers and additionally checks the route's import boundary. `tests/unit/admin-next-config.test.ts` is a unit/static test because it reads config text without executing Next.

## Created tests

- `tests/api/admin-health.test.ts`: GET payload/timestamp/environment, HEAD status/header/empty body, and dependency-free import assertion (3 tests).
- `tests/unit/admin-next-config.test.ts`: standalone config literal (1 test).

Both files were created only after reading the relevant test conventions; their focused run passed (4 tests).
