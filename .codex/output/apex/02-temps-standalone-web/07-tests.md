# Step 07: Tests

**Task:** Standalone web output with exact acceptance from 02a
**Started:** 2026-08-13T11:51:05Z

---

## Test Analysis and Creation

_Test strategy and implementation will be documented here..._

## Test analysis

- Framework: Vitest 3.2.7, configured by `vitest.config.mts`; `tests/unit/*.test.ts` run in the mocked Node project and unit tests must not mock or perform I/O beyond the filesystem contract under test.
- Existing convention inspected in `tests/unit/env.test.ts`: named `describe`/`it`/`expect` imports and focused behavioural assertions.
- The implementation is a static configuration contract, not an API/service/component. A text read is the required test boundary so Next config plugins are not executed.

## Test plan and result

- `tests/unit/next-config.test.ts` asserts `next.config.ts` contains the standalone output literal. This covers the regression that would remove the runtime artifact; no additional test cases are justified for this one-property static contract.
- The test was created during Execute after the same test infrastructure and conventions were read, and the focused run passed (1 test).
