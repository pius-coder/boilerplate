import { describe, expect, it } from "vitest";

import { getSentryRuntimeConfig } from "@/config/sentry";

describe("Sentry runtime configuration", () => {
  it("is a no-op without a DSN", () => {
    expect(getSentryRuntimeConfig(undefined)).toEqual({
      dsn: undefined,
      enabled: false,
      tracesSampleRate: 1,
      sendDefaultPii: false,
    });
  });

  it("enables telemetry without treating the public DSN as a secret", () => {
    const dsn = "https://public@example.com/7";

    expect(getSentryRuntimeConfig(dsn)).toEqual({
      dsn,
      enabled: true,
      tracesSampleRate: 1,
      sendDefaultPii: false,
    });
  });
});
