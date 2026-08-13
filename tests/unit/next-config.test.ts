/**
 * A standalone build must emit the server artifact the deployment runtime starts.
 * This reads the config as text so the regression check never executes Next config
 * plugins or performs build-time I/O.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const NEXT_CONFIG = resolve(__dirname, "../../next.config.ts");

const source = readFileSync(NEXT_CONFIG, "utf8");

describe("web Next config", () => {
  it("declares standalone output", () => {
    expect(source).toMatch(/\boutput\s*:\s*["']standalone["']/);
  });
});
