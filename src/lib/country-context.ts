/**
 * Pure country-context resolution for the middleware.
 *
 * The middleware writes an internal `x-app-country` header on every request so
 * routes can read one normalized code, the same way they already receive the
 * request id. Everything here is a pure function over plain values — no I/O,
 * no network, no database — so the priority and stripping rules are unit
 * testable without booting Next.
 */

import { COUNTRY_HEADER, COUNTRY_PREFERENCE_COOKIE } from "@/config/country-context";

export type CountrySource = "cookie" | "geo-header" | "default";

export interface CountryResolution {
  code: string;
  source: CountrySource;
}

/**
 * Normalize a candidate country code, returning null when it is not one of the
 * supported codes.
 */
export function normalizeCountryCode(
  value: string | null | undefined,
  supportedCodes: readonly string[],
): string | null {
  const code = (value ?? "").toString().trim().toUpperCase();
  if (!code) return null;

  return supportedCodes.includes(code) ? code : null;
}

/**
 * Read the country preference cookie from a `Cookie` request header. Returns
 * the raw value; validity is decided by the caller through
 * `normalizeCountryCode`.
 */
export function parseCountryCookie(
  cookieHeader: string | null | undefined,
): string | null {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COUNTRY_PREFERENCE_COOKIE && rest.length > 0) {
      const value = rest.join("=").trim();
      return value.length > 0 ? value : null;
    }
  }

  return null;
}

/**
 * Resolve the internal country for a request.
 *
 * Priority: a valid preference cookie, then the configured geo header (only
 * when a trusted proxy is configured AND present), then the default. The
 * incoming `x-app-country` value is deliberately not an input here — the
 * middleware strips it before this runs, because a client-supplied value is
 * never a source.
 */
export function resolveCountryContext(input: {
  cookieHeader: string | null | undefined;
  /** Configured detection header name, or null when detection is off. */
  geoHeaderName: string | null | undefined;
  /** The value of that geo header, if present on this request. */
  geoHeaderValue: string | null | undefined;
  supportedCodes: readonly string[];
  defaultCode: string;
}): CountryResolution {
  const cookieCode = normalizeCountryCode(
    parseCountryCookie(input.cookieHeader),
    input.supportedCodes,
  );
  if (cookieCode) {
    return { code: cookieCode, source: "cookie" };
  }

  const geoHeaderName = input.geoHeaderName?.trim();
  if (geoHeaderName) {
    const geoCode = normalizeCountryCode(input.geoHeaderValue, input.supportedCodes);
    if (geoCode) {
      return { code: geoCode, source: "geo-header" };
    }
  }

  return { code: input.defaultCode, source: "default" };
}

/**
 * Apply the country context to a copy of the request headers.
 *
 * Always deletes any incoming `x-app-country` — a caller-supplied value is
 * never trusted, even when it happens to match a supported code — then writes
 * the resolved internal value. Returns the resolution so the middleware can
 * mirror it onto the response.
 */
export function applyCountryContext(
  requestHeaders: Headers,
  input: Parameters<typeof resolveCountryContext>[0],
): CountryResolution {
  requestHeaders.delete(COUNTRY_HEADER);

  const resolution = resolveCountryContext(input);
  requestHeaders.set(COUNTRY_HEADER, resolution.code);

  return resolution;
}
