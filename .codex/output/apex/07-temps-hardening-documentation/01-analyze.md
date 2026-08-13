# Step 01: Analyze

**Task:** Durcissement et validation cumulative Temps
**Started:** 2026-08-13T13:46:36Z

---

## Context Discovery

_Findings will be appended here as exploration progresses..._

## Cumulative Audit Context

### Delivered code/config observed
- Both `next.config.ts` and `apps/admin/next.config.ts` set `output: "standalone"`; focused config tests exist.
- Web and admin `/api/health` handlers import only `next/server`, expose GET/HEAD, and do not touch DB, auth, services, models, or i18n.
- Root `.temps.yaml` exactly defines `/api/health` plus the five-minute `/api/cron/jobs` schedule; existing `vercel.json` remains present.
- `@temps-sdk/react-analytics` is pinned exactly to `0.0.4` in `package.json`; `bun.lock` matches the protected baseline, but `pnpm-lock.yaml` has no Temps entry and is therefore incoherent with the manifest (real hardening defect).
- Temps flag defaults false and only the public boolean is browser-visible; server Temps/Sentry/OTEL values have no `NEXT_PUBLIC_*` twins.
- Consent provider is production-only, flag-gated, version-2 consent-gated, explicit `enableSessionRecording={false}`, same-origin `/api/_temps`, and contains no project ID, identity, custom event, domain, or replay config. GA yields to Temps; admin has no analytics import.
- CSP implementation has no diff and `/api/_temps` needs no external origin. Protected hashes still match schema/auth/journal/snapshots/bun baseline.

### Documentation observed
- `DEPLOYMENT.md` already has a short Temps section covering health, cron Bearer, separate admin project, and no remote verification, but it lacks an explicit standalone/build/Temps-injected-vars contract.
- `README.md` has no Temps section.
- `docs/african-baseline.md` still describes all Temps work as future and incorrectly says standalone is absent.
- Official pages fetched successfully today: deploy-nextjs requires standalone output; the React SDK documents the provider/basePath/disabled/ignoreLocalhost/session recording props; cron docs require root/monorepo `.temps.yaml` and recommend endpoint-side Bearer validation.

### In-scope corrections
- Repair only the pnpm lock coherence defect while preserving protected `bun.lock`.
- Update the three required documentation files to separate delivered repository behavior from deferred remote deployment, Sentry, OTEL, Fapshi, GA/Vercel removal, and remote admin configuration.
- Run the requested cumulative targeted/tests/type/lint/build/smoke/diff/hash/status gates using Bun commands per the user's latest instruction.
