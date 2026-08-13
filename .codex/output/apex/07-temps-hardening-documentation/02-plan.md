# Step 02: Plan

**Task:** Durcissement et validation cumulative Temps
**Started:** 2026-08-13T13:46:36Z

---

## Planning Progress

_Implementation plan will be written here..._

## File-by-file Plan

### `pnpm-lock.yaml`
- Regenerate lock metadata from the exact manifest with a Bun-launched pnpm 10.22 lock-only command; accept only the minimal SDK/core entries and importer line. Preserve `bun.lock` byte-for-byte.

### `README.md`
- Add a concise “Temps (optional)” section naming the default-off flag, explicit analytics consent, separate web/admin builds, and `DEPLOYMENT.md`.

### `DEPLOYMENT.md`
- Expand the existing Temps section with standalone output, web/admin build commands, health GET/HEAD, cron Bearer contract, two distinct projects/admin-from-root configuration, and the fact that Temps-injected Sentry/OTEL variables do not mean either integration exists. Preserve the explicit no-remote-deployment claim.

### `docs/african-baseline.md`
- Replace stale/future statements in the Temps dossier with an exact delivered inventory.
- Retain explicit deferrals for real remote deploy/smoke, Sentry, OTEL, Fapshi, GA/Vercel removal, and remote admin configuration.

### Validation/evidence
- Audit forbidden files/configs and targeted Temps/health/cron/env/consent/CSP/architecture tests.
- Run Bun typecheck, lint, fast tests, web/admin builds and standalone GET/HEAD smokes on 3100/3101, kill/check processes, diff check, protected hashes, lock coherence, and status.
- Adversarially review documentation truthfulness, lock scope, secret exposure, analytics duplication, admin isolation, and any unclaimed deployment.
