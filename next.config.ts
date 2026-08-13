import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";
import { securityHeadersRoute } from "./src/config/security-headers.js";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig = {
  output: "standalone" as const,
  experimental: {
    optimizePackageImports: ["sonner"],
  },
  async headers() {
    return [securityHeadersRoute()];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // Temps accepts Sentry events but does not provide Sentry's release-upload
  // credentials. Runtime stack traces still work; source-map upload stays off.
  silent: true,
  telemetry: false,
  sourcemaps: { disable: true },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
