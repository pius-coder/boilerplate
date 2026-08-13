#!/usr/bin/env node

const EXPECTED_NAME = "bun";
const EXPECTED_VERSION = "1.3.14";
const userAgent = process.env.npm_config_user_agent ?? "";
const [actualName, actualVersion] = userAgent.split(" ", 1)[0]?.split("/") ?? [];

if (!userAgent) {
  console.warn(
    `Package-manager check skipped because npm_config_user_agent is unavailable. Use Bun ${EXPECTED_VERSION}.`
  );
  process.exit(0);
}

if (actualName !== EXPECTED_NAME || actualVersion !== EXPECTED_VERSION) {
  console.error(
    [
      `This repository requires ${EXPECTED_NAME} ${EXPECTED_VERSION}.`,
      `Detected: ${actualName || "unknown"} ${actualVersion || "unknown"}.`,
      "Install Bun directly and run `bun install`; Corepack is not used by this repository.",
    ].join("\n")
  );
  process.exit(1);
}
