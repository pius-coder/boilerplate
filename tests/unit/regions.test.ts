import { describe, expect, it } from "vitest";

import {
  DEFAULT_REGION_CODE,
  REGION_PROFILES,
  getRegionProfile,
} from "@/config/regions";

describe("region profiles", () => {
  it("shapes the Cameroon profile for XAF and +237", () => {
    const cameroon = REGION_PROFILES.CM;

    expect(cameroon).toMatchObject({
      code: "CM",
      name: "Cameroon",
      currency: "XAF",
      currencyExponent: 0,
      callingCode: "+237",
      timeZone: "Africa/Douala",
      suggestedLocales: ["fr", "en"],
    });
    expect(cameroon.mobileNumberPattern.test("612345678")).toBe(true);
    expect(cameroon.mobileNumberPattern.test("512345678")).toBe(false);
  });

  it("keys the default country to a shipped profile", () => {
    expect(REGION_PROFILES[DEFAULT_REGION_CODE]).toBeDefined();
  });

  it("resolves known codes case-insensitively and trims whitespace", () => {
    expect(getRegionProfile("cm").code).toBe("CM");
    expect(getRegionProfile(" CM ").code).toBe("CM");
    expect(getRegionProfile("CM").code).toBe("CM");
  });

  it("falls back to the default for unknown or empty codes", () => {
    expect(getRegionProfile("US").code).toBe(DEFAULT_REGION_CODE);
    expect(getRegionProfile("").code).toBe(DEFAULT_REGION_CODE);
    expect(getRegionProfile(null).code).toBe(DEFAULT_REGION_CODE);
    expect(getRegionProfile(undefined).code).toBe(DEFAULT_REGION_CODE);
  });
});
