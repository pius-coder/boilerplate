/**
 * Money arithmetic for integer minor units.
 *
 * Amounts are always whole numbers in the currency's minor unit — for XAF that
 * unit is the franc, never a cent. No float arithmetic happens anywhere in this
 * module: parsing a decimal string goes through BigInt, and formatting renders
 * an exact decimal *string* through `Intl.NumberFormat` (which parses the
 * string as a mathematical value, so no precision is lost and no risky
 * bigint→number conversion ever happens).
 *
 * This module knows nothing about credits, orders, or payment providers.
 */

export const MAX_SAFE_MINOR_UNITS = Number.MAX_SAFE_INTEGER;

/**
 * Accept only whole minor-unit amounts that can be represented exactly.
 */
export function isSafeMinorUnits(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    Math.abs(value) <= MAX_SAFE_MINOR_UNITS
  );
}

/**
 * Currency exponent overrides for the cases where the default two-decimal
 * convention is not sufficient. The regional profile remains the preferred
 * source of truth; this table only makes the standalone formatter safe for
 * common currencies when a caller does not pass an explicit exponent.
 *
 * Deterministic table used by `resolveCurrencyExponent`; it is the documented
 * fallback when a caller does not pass an explicit exponent. The three sets are
 * mutually exclusive and cover every ISO 4217 exponent in use (0, 2, 3).
 */
const ISO_ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF", "CLP", "DJF", "GNF", "ISK", "JPY", "KMF", "KRW", "MGA",
  "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

const ISO_THREE_DECIMAL_CURRENCIES = new Set([
  "BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND",
]);

const ISO_FOUR_DECIMAL_CURRENCIES = new Set(["CLF", "UYW"]);

/**
 * Resolve a currency's minor-unit exponent from the deterministic ISO table.
 *
 * Contract: `"XAF"` → 0, zero-decimal currencies → 0, the three-decimal and
 * four-decimal exceptions are explicit, and other well-formed currency codes
 * use the conventional exponent 2. Anything that is not a three-letter code
 * is rejected with a `RangeError` rather than guessed.
 */
export function resolveCurrencyExponent(currency: string): number {
  const code = (currency ?? "").toString().trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new RangeError(`currency must be a 3-letter ISO 4217 code: ${JSON.stringify(currency)}`);
  }

  if (ISO_ZERO_DECIMAL_CURRENCIES.has(code)) return 0;
  if (ISO_THREE_DECIMAL_CURRENCIES.has(code)) return 3;
  if (ISO_FOUR_DECIMAL_CURRENCIES.has(code)) return 4;
  return 2;
}

/**
 * Exact decimal string for a whole minor-unit amount — the only conversion
 * from minor units to major units, and it never touches a float.
 *
 * `1099` (exponent 2) → `"10.99"`, `5` → `"0.05"`, `0` → `"0.00"`, and for
 * XAF (exponent 0) `1500` → `"1500"`. The input is already a validated safe
 * integer, so the result always fits a mathematical value `Intl.NumberFormat`
 * can render exactly.
 */
export function minorUnitsToDecimalString(amount: number, exponent: number): string {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 9) {
    throw new RangeError(
      `currency exponent must be an integer between 0 and 9, received ${exponent}`,
    );
  }
  if (!isSafeMinorUnits(amount)) {
    throw new RangeError(`amount is not whole minor units: ${JSON.stringify(amount)}`);
  }

  const sign = amount < 0 ? "-" : "";
  const digits = BigInt(Math.abs(amount)).toString();

  if (exponent === 0) return `${sign}${digits}`;

  const padded = digits.padStart(exponent + 1, "0");
  const integerPart = padded.slice(0, -exponent) || "0";
  const fractionPart = padded.slice(-exponent);
  return `${sign}${integerPart}.${fractionPart}`;
}

const DECIMAL_SEPARATORS = new Set([".", ","]);

const SCIENTIFIC_PATTERN = /[eE]/;

/**
 * Convert a decimal string into integer minor units without float math.
 *
 * The string is the product surface's input; the exponent comes from the
 * region profile (0 for XAF). Everything ambiguous or unrepresentable is
 * rejected with a `RangeError` rather than silently rounded:
 *
 * - empty or whitespace-only input, `NaN`, `Infinity`;
 * - scientific notation and a leading `+`;
 * - a mix of `.` and `,` (ambiguous group/decimal separators);
 * - repeated separators or a separator without digits on both sides;
 * - more fraction digits than the exponent allows (e.g. `1500.50` for XAF);
 * - a result outside `Number.MAX_SAFE_INTEGER`.
 */
export function minorUnitsFromDecimal(input: string, exponent: number): number {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 9) {
    throw new RangeError(
      `currency exponent must be an integer between 0 and 9, received ${exponent}`,
    );
  }

  const source = (input ?? "").trim();
  if (!source) {
    throw new RangeError("amount is empty");
  }

  if (SCIENTIFIC_PATTERN.test(source) || /^[+-]?nan$/i.test(source)) {
    throw new RangeError(`amount is not a plain decimal: ${JSON.stringify(input)}`);
  }

  if (source.startsWith("+")) {
    throw new RangeError(`amount must not carry an explicit plus sign: ${JSON.stringify(input)}`);
  }

  const negative = source.startsWith("-");
  const unsigned = negative ? source.slice(1) : source;

  const separators = [...unsigned].filter((char) => DECIMAL_SEPARATORS.has(char));
  const distinctSeparators = new Set(separators);
  if (distinctSeparators.size > 1 || separators.length > 1) {
    throw new RangeError(`ambiguous decimal separators: ${JSON.stringify(input)}`);
  }

  let integerPart = unsigned;
  let fractionPart = "";
  if (separators.length === 1) {
    const split = unsigned.split(separators[0]!);
    integerPart = split[0]!;
    fractionPart = split[1] ?? "";
  }

  if (!/^\d+$/.test(integerPart) || !/^\d*$/.test(fractionPart)) {
    throw new RangeError(`invalid decimal amount: ${JSON.stringify(input)}`);
  }

  if (fractionPart.length > exponent) {
    throw new RangeError(
      `amount has more decimals than the currency allows (max ${exponent}): ${JSON.stringify(input)}`,
    );
  }

  const scale = BigInt(10) ** BigInt(exponent);
  const whole = BigInt(integerPart) * scale + BigInt(fractionPart.padEnd(exponent, "0"));
  const signed = negative ? -whole : whole;

  if (signed > BigInt(MAX_SAFE_MINOR_UNITS) || signed < -BigInt(MAX_SAFE_MINOR_UNITS)) {
    throw new RangeError(`amount exceeds Number.MAX_SAFE_INTEGER: ${JSON.stringify(input)}`);
  }

  return Number(signed);
}

/**
 * Format whole minor units as a localized currency amount.
 *
 * The browser is the only place this should be called: `Intl.NumberFormat`
 * handles grouping, the currency token, and the currency's own fraction-digit
 * data (XAF renders without decimals, USD with two). Callers must already hold
 * an integer value — anything else is a programming error and throws.
 *
 * Contract (explicit, see the module header):
 * - `exponent` is optional; when omitted it is resolved deterministically from
 *   the currency via `resolveCurrencyExponent` (XAF → 0).
 * - An explicit `exponent` wins over the table — a caller converting a stored
 *   amount for a currency whose ISO exponent is disputed may pin it.
 * - The decimal is computed with BigInt and passed to `Intl.NumberFormat` as a
 *   string, so `1099` minor units of USD render as `10.99` — never `1099.00` —
 *   and a `MAX_SAFE_MINOR_UNITS` amount renders exactly, without a silent
 *   bigint→number narrowing.
 */
export function formatMinorUnits(
  amount: number,
  currency: string,
  locale: string,
  exponent: number = resolveCurrencyExponent(currency),
): string {
  const decimal = minorUnitsToDecimalString(amount, exponent);

  // TypeScript's ES2017 lib does not widen an arbitrary string to Intl's
  // StringNumericLiteral type. This value is produced by the exact decimal
  // formatter above, so the assertion does not permit caller-controlled input.
  const numericDecimal = decimal as `${number}`;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(numericDecimal);
}
