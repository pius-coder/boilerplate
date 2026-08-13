import * as Sentry from "@sentry/nextjs";

import { getSentryRuntimeConfig } from "@/config/sentry";

Sentry.init(getSentryRuntimeConfig());
