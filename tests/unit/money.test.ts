import { describe, expect, it } from "vitest";

import {
  MAX_SAFE_MINOR_UNITS,
  formatMinorUnits,
  isSafeMinorUnits,
  minorUnitsFromDecimal,
  minorUnitsToDecimalString,
  resolveCurrencyExponent,
} from "@/lib/money";

describe("isSafeMinorUnits", () => {
  it("accepts whole numbers within the safe range", () => {
    expect(isSafeMinorUnits(0)).toBe(true);
    expect(isSafeMinorUnits(1500)).toBe(true);
    expect(isSafeMinorUnits(-1500)).toBe(true);
    expect(isSafeMinorUnits(MAX_SAFE_MINOR_UNITS)).toBe(true);
  });

  it("rejects fractions, non-finite values, and overflow", () => {
    expect(isSafeMinorUnits(1.5)).toBe(false);
    expect(isSafeMinorUnits(NaN)).toBe(false);
    expect(isSafeMinorUnits(Infinity)).toBe(false);
    expect(isSafeMinorUnits(-Infinity)).toBe(false);
    expect(isSafeMinorUnits(MAX_SAFE_MINOR_UNITS + 1)).toBe(false);
    expect(isSafeMinorUnits("1500")).toBe(false);
  });
});

describe("minorUnitsFromDecimal", () => {
  it("parses zero-exponent currencies like XAF without decimals", () => {
    expect(minorUnitsFromDecimal("1500", 0)).toBe(1500);
    expect(minorUnitsFromDecimal("0", 0)).toBe(0);
    expect(minorUnitsFromDecimal("007", 0)).toBe(7);
    expect(minorUnitsFromDecimal("-500", 0)).toBe(-500);
    // "1500.00" is a two-decimal amount in disguise; XAF has no cents.
    expect(() => minorUnitsFromDecimal("1500.00", 0)).toThrow(RangeError);
    expect(() => minorUnitsFromDecimal("1500.5", 0)).toThrow(RangeError);
  });

  it("parses cent-based currencies against their exponent", () => {
    expect(minorUnitsFromDecimal("10", 2)).toBe(1000);
    expect(minorUnitsFromDecimal("10.9", 2)).toBe(1090);
    expect(minorUnitsFromDecimal("10.99", 2)).toBe(1099);
    expect(minorUnitsFromDecimal("-10.99", 2)).toBe(-1099);
    expect(() => minorUnitsFromDecimal("10.999", 2)).toThrow(RangeError);
  });

  it("accepts a single comma as the decimal separator", () => {
    expect(minorUnitsFromDecimal("1,2", 2)).toBe(120);
    expect(minorUnitsFromDecimal("10,99", 2)).toBe(1099);
  });

  it("rejects empty, non-decimal, and ambiguous input", () => {
    for (const input of ["", "   ", "NaN", "Infinity", "-Infinity", "abc"]) {
      expect(() => minorUnitsFromDecimal(input, 0)).toThrow(RangeError);
    }

    for (const input of ["1e3", "1E3", "1e+3", "+10", "1.2.3", "1,5.5"]) {
      expect(() => minorUnitsFromDecimal(input, 2)).toThrow(RangeError);
    }
  });

  it("rejects amounts beyond Number.MAX_SAFE_INTEGER", () => {
    expect(minorUnitsFromDecimal(String(MAX_SAFE_MINOR_UNITS), 0)).toBe(
      MAX_SAFE_MINOR_UNITS,
    );
    expect(() =>
      minorUnitsFromDecimal(String(MAX_SAFE_MINOR_UNITS + 1), 0),
    ).toThrow(RangeError);
  });

  it("rejects invalid exponents", () => {
    for (const exponent of [-1, 10, 1.5, NaN]) {
      expect(() => minorUnitsFromDecimal("100", exponent)).toThrow(
        RangeError,
      );
    }
  });
});

describe("resolveCurrencyExponent", () => {
  it("resolves exponents deterministically from the ISO table", () => {
    expect(resolveCurrencyExponent("XAF")).toBe(0);
    expect(resolveCurrencyExponent("xaf")).toBe(0);
    expect(resolveCurrencyExponent("JPY")).toBe(0);
    expect(resolveCurrencyExponent("USD")).toBe(2);
    expect(resolveCurrencyExponent("EUR")).toBe(2);
    expect(resolveCurrencyExponent("KWD")).toBe(3);
    expect(resolveCurrencyExponent("CLF")).toBe(4);
    expect(resolveCurrencyExponent("UYW")).toBe(4);
  });

  it("rejects anything that is not a 3-letter currency code", () => {
    for (const currency of ["US", "", "  ", "USDD", "1", null as unknown as string]) {
      expect(() => resolveCurrencyExponent(currency)).toThrow(RangeError);
    }
  });
});

describe("minorUnitsToDecimalString", () => {
  it("converts whole minor units to an exact decimal string", () => {
    expect(minorUnitsToDecimalString(1099, 2)).toBe("10.99");
    expect(minorUnitsToDecimalString(5, 2)).toBe("0.05");
    expect(minorUnitsToDecimalString(0, 2)).toBe("0.00");
    expect(minorUnitsToDecimalString(-1099, 2)).toBe("-10.99");
    expect(minorUnitsToDecimalString(1500, 0)).toBe("1500");
    expect(minorUnitsToDecimalString(MAX_SAFE_MINOR_UNITS, 2)).toBe(
      "90071992547409.91",
    );
  });

  it("rejects unsafe amounts and invalid exponents", () => {
    expect(() => minorUnitsToDecimalString(1.5, 2)).toThrow(RangeError);
    expect(() => minorUnitsToDecimalString(MAX_SAFE_MINOR_UNITS + 1, 2)).toThrow(
      RangeError,
    );
    expect(() => minorUnitsToDecimalString(1099, -1)).toThrow(RangeError);
    expect(() => minorUnitsToDecimalString(1099, 10)).toThrow(RangeError);
  });
});

describe("formatMinorUnits", () => {
  it("formats with grouping in the requested locale", () => {
    const formatted = formatMinorUnits(1500, "XAF", "en-US");
    expect(formatted).toContain("1,500");
    expect(formatted).not.toContain("NaN");
  });

  it("converts 1099 USD minor units to 10.99, never 1099.00", () => {
    const usd = formatMinorUnits(1099, "USD", "en-US");
    expect(usd).toContain("10.99");
    expect(usd).not.toContain("1099.00");

    // The explicit exponent matches the deterministic table default for USD.
    expect(formatMinorUnits(1099, "USD", "en-US", 2)).toBe(usd);
  });

  it("keeps XAF zero-decimal", () => {
    const xaf = formatMinorUnits(1500, "XAF", "en-US");
    expect(xaf).toContain("1,500");
    expect(xaf).not.toContain(".00");
    expect(xaf).not.toContain(",00");
    expect(formatMinorUnits(1500, "XAF", "en-US", 0)).toBe(xaf);
  });

  it("preserves four-decimal currencies when the caller omits the exponent", () => {
    const clf = formatMinorUnits(12345, "CLF", "en-US");
    expect(clf).toContain("1.2345");
    expect(clf).not.toContain("123.45");
  });

  it("handles zero, negative, and safe-limit amounts", () => {
    expect(formatMinorUnits(0, "USD", "en-US")).toContain("0.00");

    const negative = formatMinorUnits(-1099, "USD", "en-US");
    expect(negative).toContain("10.99");
    expect(negative).not.toBe(formatMinorUnits(1099, "USD", "en-US"));

    // MAX_SAFE_MINOR_UNITS / 100 must render exactly: no float, no narrowing.
    const digitsOnly = (value: string) => value.replace(/[^0-9.\-]/g, "");
    expect(digitsOnly(formatMinorUnits(MAX_SAFE_MINOR_UNITS, "USD", "en-US"))).toBe(
      "90071992547409.91",
    );
  });

  it("never accepts anything but whole minor units", () => {
    expect(() => formatMinorUnits(1.5, "XAF", "en-US")).toThrow(RangeError);
    expect(() => formatMinorUnits(NaN, "XAF", "en-US")).toThrow(RangeError);
    expect(() => formatMinorUnits(MAX_SAFE_MINOR_UNITS + 1, "XAF", "en-US")).toThrow(
      RangeError,
    );
  });

  it("rejects invalid currencies and exponents instead of guessing", () => {
    expect(() => formatMinorUnits(1099, "US", "en-US")).toThrow(RangeError);
    expect(() => formatMinorUnits(1099, "USD", "en-US", -1)).toThrow(RangeError);
    expect(() => formatMinorUnits(1099, "USD", "en-US", 10)).toThrow(RangeError);
  });
});
