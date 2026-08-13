/**
 * Transport names and configuration for the internal country context.
 *
 * The middleware always deletes any client-supplied `x-app-country`, then
 * writes an internal normalized value. Resolution order: valid preference
 * cookie, then an explicitly configured geo header written by a trusted proxy,
 * then the default country.
 *
 * Header detection is OFF by default: Temps documents no native country header,
 * so a deployment must opt in by setting `COUNTRY_DETECTION_HEADER` to one of
 * the supported names below. The reverse proxy/CDN is then responsible for
 * deleting any client-supplied copy of that header and writing its own value.
 * This variable is server-only; there is deliberately no `NEXT_PUBLIC_` form.
 */
export const COUNTRY_PREFERENCE_COOKIE = "app_country";
export const COUNTRY_HEADER = "x-app-country";

/**
 * Closed list of geo-header names this starter recognizes. Anything else is
 * ignored, so a proxy forwarding an arbitrary header cannot enable a vector the
 * operator never reviewed.
 */
export const SUPPORTED_COUNTRY_DETECTION_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "cloudfront-viewer-country",
  "x-country-code",
] as const;

export type SupportedCountryDetectionHeader =
  (typeof SUPPORTED_COUNTRY_DETECTION_HEADERS)[number];

/**
 * Resolve the configured detection header, refusing anything outside the
 * closed list. Returns null when unset or unknown — detection then stays off
 * and the default country wins.
 */
export function resolveCountryDetectionHeader(
  value: string | null | undefined,
): SupportedCountryDetectionHeader | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return null;

  return SUPPORTED_COUNTRY_DETECTION_HEADERS.includes(
    normalized as SupportedCountryDetectionHeader,
  )
    ? (normalized as SupportedCountryDetectionHeader)
    : null;
}
