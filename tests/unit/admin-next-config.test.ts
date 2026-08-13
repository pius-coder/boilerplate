/**
 * The admin deployment must emit a standalone server artifact. Read the config
 * as text so this proof does not execute dotenv, Next, or security-header code.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ADMIN_NEXT_CONFIG = resolve(__dirname, "../../apps/admin/next.config.ts");
const source = readFileSync(ADMIN_NEXT_CONFIG, "utf8");

describe("admin Next config", () => {
  it("declares standalone output", () => {
    expect(source).toMatch(/\boutput\s*:\s*["']standalone["']/);
  });
});
