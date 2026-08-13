/**
 * Hosting platforms expose production service variables during image builds.
 * Mocked tests must never inherit them: doing so makes a unit test contact the
 * deployment Redis and lets provider-specific endpoints alter env validation.
 *
 * Real infrastructure tests opt in exclusively through TEST_DATABASE_URL and
 * TEST_REDIS_URL, which are intentionally left untouched here.
 */
for (const key of [
  "POSTGRES_URL",
  "REDIS_URL",
  "S3_ENDPOINT",
  "AWS_ENDPOINT_URL",
  "NEXT_PUBLIC_SENTRY_DSN",
]) {
  delete process.env[key];
}
