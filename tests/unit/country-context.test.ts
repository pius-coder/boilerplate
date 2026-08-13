import { describe, expect, it } from "vitest";

import {
  COUNTRY_HEADER,
  COUNTRY_PREFERENCE_COOKIE,
  SUPPORTED_COUNTRY_DETECTION_HEADERS,
  resolveCountryDetectionHeader,
} from "@/config/country-context";
import { DEFAULT_REGION_CODE, REGION_PROFILES } from "@/config/regions";
import {
  applyCountryContext,
  normalizeCountryCode,
  parseCountryCookie,
  resolveCountryContext,
} from "@/lib/country-context";

const SUPPORTED_CODES = Object.keys(REGION_PROFILES);

function resolve(input: {
  cookieHeader?: string | null;
  geoHeaderName?: string | null;
  geoHeaderValue?: string | null;
}) {
  return resolveCountryContext({
    cookieHeader: input.cookieHeader,
    geoHeaderName: input.geoHeaderName,
    geoHeaderValue: input.geoHeaderValue,
    supportedCodes: SUPPORTED_CODES,
    defaultCode: DEFAULT_REGION_CODE,
  });
}

describe("country context transport", () => {
  it("names the internal cookie and header", () => {
    expect(COUNTRY_PREFERENCE_COOKIE).toBe("app_country");
    expect(COUNTRY_HEADER).toBe("x-app-country");
  });

  it("accepts only the closed list of detection headers", () => {
    expect(SUPPORTED_COUNTRY_DETECTION_HEADERS).toEqual([
      "cf-ipcountry",
      "x-vercel-ip-country",
      "cloudfront-viewer-country",
      "x-country-code",
    ]);

    expect(resolveCountryDetectionHeader("cf-ipcountry")).toBe("cf-ipcountry");
    expect(resolveCountryDetectionHeader("CF-IPCOUNTRY")).toBe("cf-ipcountry");
    expect(resolveCountryDetectionHeader(" x-country-code ")).toBe(
      "x-country-code",
    );
    expect(resolveCountryDetectionHeader("x-real-ip")).toBeNull();
    expect(resolveCountryDetectionHeader("x-forwarded-for")).toBeNull();
    expect(resolveCountryDetectionHeader("")).toBeNull();
    expect(resolveCountryDetectionHeader(null)).toBeNull();
    expect(resolveCountryDetectionHeader(undefined)).toBeNull();
  });
});

describe("normalizeCountryCode", () => {
  it("normalizes supported codes and rejects everything else", () => {
    expect(normalizeCountryCode("cm", SUPPORTED_CODES)).toBe("CM");
    expect(normalizeCountryCode(" CM ", SUPPORTED_CODES)).toBe("CM");
    expect(normalizeCountryCode("US", SUPPORTED_CODES)).toBeNull();
    expect(normalizeCountryCode("", SUPPORTED_CODES)).toBeNull();
    expect(normalizeCountryCode(null, SUPPORTED_CODES)).toBeNull();
    expect(normalizeCountryCode(undefined, SUPPORTED_CODES)).toBeNull();
  });
});

describe("parseCountryCookie", () => {
  it("reads the preference cookie from a Cookie header", () => {
    expect(parseCountryCookie(`foo=1; ${COUNTRY_PREFERENCE_COOKIE}=cm; bar=2`)).toBe(
      "cm",
    );
    expect(parseCountryCookie(`${COUNTRY_PREFERENCE_COOKIE}=`)).toBeNull();
    expect(parseCountryCookie(`x${COUNTRY_PREFERENCE_COOKIE}=cm`)).toBeNull();
    expect(parseCountryCookie(null)).toBeNull();
    expect(parseCountryCookie(undefined)).toBeNull();
  });
});

describe("resolveCountryContext", () => {
  it("prefers a valid preference cookie over the geo header", () => {
    expect(
      resolve({ cookieHeader: `${COUNTRY_PREFERENCE_COOKIE}=cm`, geoHeaderName: "cf-ipcountry", geoHeaderValue: "US" }),
    ).toEqual({ code: "CM", source: "cookie" });
  });

  it("falls back to the geo header when there is no valid cookie", () => {
    expect(resolve({ geoHeaderName: "cf-ipcountry", geoHeaderValue: "CM" })).toEqual(
      { code: "CM", source: "geo-header" },
    );
    expect(
      resolve({ cookieHeader: `${COUNTRY_PREFERENCE_COOKIE}=us`, geoHeaderName: "cf-ipcountry", geoHeaderValue: "CM" }),
    ).toEqual({ code: "CM", source: "geo-header" });
  });

  it("defaults when neither cookie nor geo header yields a supported code", () => {
    expect(resolve({})).toEqual({ code: DEFAULT_REGION_CODE, source: "default" });
    expect(resolve({ geoHeaderName: "cf-ipcountry", geoHeaderValue: "US" })).toEqual(
      { code: DEFAULT_REGION_CODE, source: "default" },
    );
  });

  it("ignores the geo header when detection is not configured", () => {
    expect(resolve({ geoHeaderName: null, geoHeaderValue: "CM" })).toEqual({
      code: DEFAULT_REGION_CODE,
      source: "default",
    });
  });
});

describe("applyCountryContext", () => {
  it("strips any caller-supplied x-app-country and writes the resolved value", () => {
    const headers = new Headers({ [COUNTRY_HEADER]: "US", cookie: `${COUNTRY_PREFERENCE_COOKIE}=cm` });

    const resolution = applyCountryContext(headers, {
      cookieHeader: headers.get("cookie"),
      geoHeaderName: null,
      geoHeaderValue: null,
      supportedCodes: SUPPORTED_CODES,
      defaultCode: DEFAULT_REGION_CODE,
    });

    expect(resolution).toEqual({ code: "CM", source: "cookie" });
    expect(headers.get(COUNTRY_HEADER)).toBe("CM");
  });

  it("writes the default when nothing else applies", () => {
    const headers = new Headers({ [COUNTRY_HEADER]: "US" });

    const resolution = applyCountryContext(headers, {
      cookieHeader: null,
      geoHeaderName: null,
      geoHeaderValue: null,
      supportedCodes: SUPPORTED_CODES,
      defaultCode: DEFAULT_REGION_CODE,
    });

    expect(resolution).toEqual({ code: DEFAULT_REGION_CODE, source: "default" });
    expect(headers.get(COUNTRY_HEADER)).toBe(DEFAULT_REGION_CODE);
  });
});
