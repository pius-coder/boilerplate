/**
 * Shared, env-derived Sentry runtime options.
 *
 * Temps injects the public DSN at deployment time. Keeping this helper pure
 * makes an absent DSN a deliberate no-op for local and non-Temps deployments.
 */
export function getSentryRuntimeConfig(
  dsn = process.env.NEXT_PUBLIC_SENTRY_DSN,
) {
  return {
    dsn,
    enabled: Boolean(dsn),
    tracesSampleRate: 1,
    sendDefaultPii: false,
  } as const;
}
