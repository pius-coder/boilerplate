/**
 * Regional identity profiles.
 *
 * One source of truth for the country, currency, phone, and timezone the
 * product presents by default. The Cameroon profile is the shipped default;
 * adding a region is an edit to this file, not a rule scattered through the
 * codebase.
 *
 * This file is configuration: no I/O, no services, no models. It does NOT own
 * the list of active locales (that is `src/i18n/locale.ts`), the active payment
 * provider (`src/config/payments.ts`, a future lot), or any price, tier,
 * credit, or product limit.
 */

export type RegionCode = "CM";

export type CurrencyCode = "XAF";

/**
 * Regional metadata used for display defaults and input parsing. Currency
 * amounts are always stored as integers in the minor unit — for XAF the unit is
 * the franc, not a cent.
 */
export interface RegionProfile {
  /** ISO 3166-1 alpha-2 country code. */
  code: RegionCode;
  name: string;
  /** ISO 4217 currency code. */
  currency: CurrencyCode;
  /** Minor-unit exponent: 0 for XAF, 2 for a cent-based currency. */
  currencyExponent: number;
  /** E.164 calling code, including the leading `+`. */
  callingCode: string;
  /** IANA time zone. */
  timeZone: string;
  /** National mobile number shape, without the country calling code. */
  mobileNumberPattern: RegExp;
  /**
   * Regional metadata only. The i18n router keeps its own source of truth in
   * `src/i18n/locale.ts`; these are hints for a product surface that has not
   * yet made a locale decision.
   */
  suggestedLocales: readonly string[];
}

const CAMEROON: RegionProfile = {
  code: "CM",
  name: "Cameroon",
  currency: "XAF",
  currencyExponent: 0,
  callingCode: "+237",
  timeZone: "Africa/Douala",
  mobileNumberPattern: /^6\d{8}$/,
  suggestedLocales: ["fr", "en"],
};

export const REGION_PROFILES: Record<RegionCode, RegionProfile> = {
  CM: CAMEROON,
};

export const DEFAULT_REGION_CODE: RegionCode = "CM";

const regionCodeAliases: Record<string, RegionCode> = {
  cm: "CM",
};

/**
 * Resolve a candidate country code to a supported profile, falling back to the
 * default for anything unknown. The fallback is deliberate: a display default
 * is never worth failing a request over.
 */
export function getRegionProfile(code?: string | null): RegionProfile {
  const value = (code ?? "").toString().trim().toLowerCase();
  return REGION_PROFILES[regionCodeAliases[value] ?? DEFAULT_REGION_CODE];
}
