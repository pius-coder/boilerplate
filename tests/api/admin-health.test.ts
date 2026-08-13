/**
 * Admin liveness is the process-level contract used by a standalone health
 * checker. These tests keep it public and dependency-free, so a database or
 * admin session regression cannot make the service look dead.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  GET as getHealth,
  HEAD as headHealth,
} from "@admin/app/api/health/route";

const HEALTH_ROUTE = resolve(
  __dirname,
  "../../apps/admin/app/api/health/route.ts",
);

const source = readFileSync(HEALTH_ROUTE, "utf8");

describe("admin /api/health", () => {
  it("returns a public liveness payload without dependencies", async () => {
    const response = await getHealth();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "ok",
      environment: process.env.NODE_ENV,
    });
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it("answers HEAD with the service status header and no body", async () => {
    const response = await headHealth();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-service-status")).toBe("ok");
    expect(await response.text()).toBe("");
  });

  it("imports only the Next response primitive", () => {
    expect(source).toContain('from "next/server"');
    expect(source).not.toMatch(
      /from ["'][^"']*(?:services|models|db|auth|i18n)[^"']*["']/,
    );
  });
});
