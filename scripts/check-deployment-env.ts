#!/usr/bin/env bun

export {};

/**
 * Validate the production boot contract without starting Next.js or contacting
 * external services. Values are never printed: this command is safe to use in
 * CI logs and hosting terminals.
 */
Reflect.set(process.env, "NODE_ENV", "production");
Reflect.deleteProperty(process.env, "NEXT_PHASE");

const { EnvValidationError, validateAppEnv } = await import("@/lib/env");

try {
  const env = validateAppEnv();

  console.log("Production environment contract: valid");
  console.log(`- database: ${env.DATABASE_URL ? "configured" : "missing"}`);
  console.log(
    `- distributed rate limit: ${env.RATE_LIMIT_REDIS_URL ? "configured" : "missing"}`,
  );
  console.log(`- storage provider: ${env.STORAGE_PROVIDER}`);
  console.log(`- storage bucket: ${env.STORAGE_BUCKET ? "configured" : "missing"}`);
  console.log(`- storage endpoint: ${env.STORAGE_ENDPOINT ? "custom HTTPS" : "AWS default"}`);
} catch (error) {
  if (error instanceof EnvValidationError) {
    console.error(error.message);
    process.exit(1);
  }

  console.error("Production environment validation failed unexpectedly.");
  process.exit(1);
}
