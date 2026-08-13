/**
 * Profile-driven phone number normalization.
 *
 * Accepts a national number, a number with the country calling code, or a full
 * E.164 number — with reasonable presentation spaces/hyphens — and returns a
 * canonical E.164 string. Everything unrecognizable is rejected with a
 * `RangeError`: letters, extensions, wrong lengths, a different country prefix,
 * or a national number that does not match the region profile.
 *
 * Deliberately no operator classification (MTN/Orange) — that belongs to the
 * future payment adapter — and no OTP, SMS, or WhatsApp behavior.
 */

/**
 * The minimal region contract this module needs. Structurally satisfied by
 * `RegionProfile` from `src/config/regions.ts`; no import is required so this
 * stays a pure, framework-free utility.
 */
export interface PhoneProfile {
  /** E.164 calling code, with or without the leading `+`. */
  callingCode: string;
  /** National number shape, without the calling code. */
  mobileNumberPattern: RegExp;
}

const PRESENTATION_CHARS = /[\s\-()]/g;

function isDigits(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * Normalize to `+<callingCode><national>`. Throws `RangeError` for anything
 * that cannot be one unambiguous number for the profile.
 */
export function normalizePhoneNumber(
  input: string,
  profile: PhoneProfile,
): string {
  const callingCode = profile.callingCode.replace(/^\+/, "");
  if (!isDigits(callingCode)) {
    throw new RangeError(`invalid calling code in profile: ${profile.callingCode}`);
  }

  const source = (input ?? "").trim();
  if (!source) {
    throw new RangeError("phone number is empty");
  }

  const compact = source.replace(PRESENTATION_CHARS, "");
  if (!compact) {
    throw new RangeError(`phone number has no digits: ${JSON.stringify(input)}`);
  }

  if (/[^\d+]/.test(compact)) {
    throw new RangeError(`phone number contains non-numeric characters: ${JSON.stringify(input)}`);
  }

  const plusCount = (compact.match(/\+/g) ?? []).length;
  if (plusCount > 1) {
    throw new RangeError(`phone number has multiple leading plus signs: ${JSON.stringify(input)}`);
  }

  let national: string;
  if (compact.startsWith("+")) {
    const withoutPlus = compact.slice(1);
    if (!withoutPlus.startsWith(callingCode)) {
      throw new RangeError(`phone number is not a ${callingCode} number: ${JSON.stringify(input)}`);
    }
    national = withoutPlus.slice(callingCode.length);
  } else if (compact.startsWith(callingCode)) {
    national = compact.slice(callingCode.length);
  } else {
    national = compact;
  }

  if (!isDigits(national) || !profile.mobileNumberPattern.test(national)) {
    throw new RangeError(`phone number does not match the national mobile pattern: ${JSON.stringify(input)}`);
  }

  return `+${callingCode}${national}`;
}
