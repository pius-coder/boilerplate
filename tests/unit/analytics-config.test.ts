/**
 * Pure contract for the analytics configuration helpers: which vendors are
 * active, and therefore whether the consent banner and the consent-gated
 * scripts exist at all. These read `process.env` literally (Next inlines the
 * public constants at build time), so the tests stub the variables directly.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  hasAdvertising,
  hasAnalytics,
  hasConsentGatedScripts,
  hasTempsAnalytics,
} from "@/config/analytics";

const ANALYTICS_KEYS = [
  "NEXT_PUBLIC_PROJECT_SLUG",
  "NEXT_PUBLIC_TEMPS_API_URL",
  "NEXT_PUBLIC_GOOGLE_ANALYTICS_ID",
  "NEXT_PUBLIC_GOOGLE_ADCODE",
];

describe("hasTempsAnalytics", () => {
  beforeEach(() => {
    for (const key of ANALYTICS_KEYS) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false when the public configuration is absent or partial", () => {
    expect(hasTempsAnalytics()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_PROJECT_SLUG", "boilerplate");
    expect(hasTempsAnalytics()).toBe(false);
  });

  it("is true when project slug and API URL are configured", () => {
    vi.stubEnv("NEXT_PUBLIC_PROJECT_SLUG", "boilerplate");
    vi.stubEnv("NEXT_PUBLIC_TEMPS_API_URL", "https://temps.example.com");
    expect(hasTempsAnalytics()).toBe(true);
  });
});

describe("hasAnalytics", () => {
  beforeEach(() => {
    for (const key of ANALYTICS_KEYS) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false when no analytics vendor is configured", () => {
    expect(hasAnalytics()).toBe(false);
  });

  it("is true when Google Analytics is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", "G-ABC123");

    expect(hasAnalytics()).toBe(true);
  });

  it("is true when Temps public config is complete", () => {
    vi.stubEnv("NEXT_PUBLIC_PROJECT_SLUG", "boilerplate");
    vi.stubEnv("NEXT_PUBLIC_TEMPS_API_URL", "https://temps.example.com");

    expect(hasAnalytics()).toBe(true);
  });
});

describe("hasConsentGatedScripts", () => {
  beforeEach(() => {
    for (const key of ANALYTICS_KEYS) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false when no vendor is configured", () => {
    expect(hasConsentGatedScripts()).toBe(false);
  });

  it("is true when analytics (Temps or Google) is active", () => {
    vi.stubEnv("NEXT_PUBLIC_PROJECT_SLUG", "boilerplate");
    vi.stubEnv("NEXT_PUBLIC_TEMPS_API_URL", "https://temps.example.com");
    expect(hasConsentGatedScripts()).toBe(true);

    delete process.env.NEXT_PUBLIC_PROJECT_SLUG;
    delete process.env.NEXT_PUBLIC_TEMPS_API_URL;
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", "G-ABC123");
    expect(hasConsentGatedScripts()).toBe(true);
  });

  it("is true when advertising is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADCODE", "ca-pub-123");

    expect(hasAdvertising()).toBe(true);
    expect(hasConsentGatedScripts()).toBe(true);
  });
});
