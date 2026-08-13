import { describe, expect, it } from "vitest";

import { getRegionProfile } from "@/config/regions";
import { normalizePhoneNumber } from "@/lib/phone-number";

const CAMEROON = getRegionProfile("CM");

describe("normalizePhoneNumber", () => {
  it("normalizes national numbers to E.164", () => {
    expect(normalizePhoneNumber("612345678", CAMEROON)).toBe("+237612345678");
    expect(normalizePhoneNumber("6 12 34 56 78", CAMEROON)).toBe(
      "+237612345678",
    );
    expect(normalizePhoneNumber("612-34-56-78", CAMEROON)).toBe(
      "+237612345678",
    );
    expect(normalizePhoneNumber("(237) 612345678", CAMEROON)).toBe(
      "+237612345678",
    );
  });

  it("accepts numbers that already carry the country code", () => {
    expect(normalizePhoneNumber("+237612345678", CAMEROON)).toBe(
      "+237612345678",
    );
    expect(normalizePhoneNumber("+237 6 12 34 56 78", CAMEROON)).toBe(
      "+237612345678",
    );
    expect(normalizePhoneNumber("237612345678", CAMEROON)).toBe(
      "+237612345678",
    );
  });

  it("rejects empty, malformed, and foreign numbers", () => {
    for (const input of ["", "   ", "abc", "61234567", "6123456789"]) {
      expect(() => normalizePhoneNumber(input, CAMEROON)).toThrow(RangeError);
    }

    for (const input of ["512345678", "+236612345678", "++237612345678"]) {
      expect(() => normalizePhoneNumber(input, CAMEROON)).toThrow(RangeError);
    }
  });
});
