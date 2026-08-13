/**
 * Hosting configuration is part of the liveness contract: a typo here can
 * leave a healthy app undeployed or stop its job queue without a type error.
 * Read the file as text to keep this test dependency-free.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const TEMPS_CONFIG = resolve(__dirname, "../../.temps.yaml");
const source = readFileSync(TEMPS_CONFIG, "utf8");

describe("Temps hosting configuration", () => {
  it("declares the exact health check contract", () => {
    expect(source).toContain("health:\n");
    expect(source).toContain("  path: /api/health\n");
    expect(source).toContain("  status: 200\n");
    expect(source).toContain("  interval: 30\n");
    expect(source).toContain("  timeout: 5\n");
    expect(source).toContain("  retries: 3\n");
  });

  it("declares the application job drain every five minutes", () => {
    expect(source).toContain('  - path: "/api/cron/jobs"\n');
    expect(source).toContain('    schedule: "*/5 * * * *"\n');
    expect(source).toContain('    name: "Drain application jobs"\n');
  });
});
