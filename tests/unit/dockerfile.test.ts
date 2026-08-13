import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dockerfile = readFileSync(resolve(__dirname, "../../Dockerfile"), "utf8");
const dockerignore = readFileSync(
  resolve(__dirname, "../../.dockerignore"),
  "utf8",
);

describe("web Docker image", () => {
  it("builds the web standalone artifact with the pinned Bun version", () => {
    expect(dockerfile).toContain("FROM oven/bun:1.3.14 AS build");
    expect(dockerfile).toContain("RUN bun install --frozen-lockfile");
    expect(dockerfile).toContain("RUN bun run build:web");
    expect(dockerfile).toContain("/app/.next/standalone ./");
    expect(dockerfile).toContain("/app/.next/static ./.next/static");
  });

  it("runs as a non-root Node process on the platform port", () => {
    expect(dockerfile).toContain("FROM node:22-bookworm-slim AS runner");
    expect(dockerfile).toContain("HOSTNAME=0.0.0.0");
    expect(dockerfile).toContain("PORT=3000");
    expect(dockerfile).toContain("USER nextjs");
    expect(dockerfile).toContain('CMD ["node", "server.js"]');
  });

  it("keeps local secrets and build state out of the context", () => {
    expect(dockerignore).toMatch(/^\.env\*$/m);
    expect(dockerignore).toMatch(/^\.git$/m);
    expect(dockerignore).toMatch(/^node_modules$/m);
    expect(dockerignore).toMatch(/^\.next$/m);
  });
});
