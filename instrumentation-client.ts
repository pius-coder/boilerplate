import * as Sentry from "@sentry/nextjs";

import { getSentryRuntimeConfig } from "@/config/sentry";

const config = getSentryRuntimeConfig();

Sentry.init({
  ...config,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
