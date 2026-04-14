export type PhoneCountry = {
  iso: string;
  dialCode: string; // digits only, no +
  nameAr: string;
  nameEn: string;
  minDigits: number; // national number digits (without country code)
  maxDigits: number;
  /** Example placeholder users commonly type (often includes trunk 0). */
  placeholderNational?: string;
};

// Focused list for Gulf + common nearby countries.
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "SA", dialCode: "966", nameAr: "السعودية", nameEn: "Saudi Arabia", minDigits: 9, maxDigits: 9, placeholderNational: "05xxxxxxxxx" },
  { iso: "AE", dialCode: "971", nameAr: "الإمارات", nameEn: "UAE", minDigits: 9, maxDigits: 9, placeholderNational: "05xxxxxxxx" },
  { iso: "KW", dialCode: "965", nameAr: "الكويت", nameEn: "Kuwait", minDigits: 8, maxDigits: 8, placeholderNational: "5xxxxxxx" },
  { iso: "QA", dialCode: "974", nameAr: "قطر", nameEn: "Qatar", minDigits: 8, maxDigits: 8, placeholderNational: "3xxxxxxx" },
  { iso: "BH", dialCode: "973", nameAr: "البحرين", nameEn: "Bahrain", minDigits: 8, maxDigits: 8, placeholderNational: "3xxxxxxx" },
  { iso: "OM", dialCode: "968", nameAr: "عُمان", nameEn: "Oman", minDigits: 8, maxDigits: 8, placeholderNational: "9xxxxxxx" },
  { iso: "JO", dialCode: "962", nameAr: "الأردن", nameEn: "Jordan", minDigits: 9, maxDigits: 9, placeholderNational: "07xxxxxxxx" },
  { iso: "LB", dialCode: "961", nameAr: "لبنان", nameEn: "Lebanon", minDigits: 8, maxDigits: 8, placeholderNational: "03xxxxxx" },
  { iso: "EG", dialCode: "20", nameAr: "مصر", nameEn: "Egypt", minDigits: 10, maxDigits: 10, placeholderNational: "01xxxxxxxxx" },
];

export const DEFAULT_PHONE_COUNTRY_ISO = "SA";

export function digitsOnly(raw: string) {
  return String(raw ?? "").replace(/\D/g, "");
}

export function findCountryByIso(iso: string | null | undefined): PhoneCountry | undefined {
  if (!iso) return undefined;
  return PHONE_COUNTRIES.find((c) => c.iso === iso);
}

export function findCountryByDialCode(dialCodeDigits: string): PhoneCountry | undefined {
  return PHONE_COUNTRIES.find((c) => c.dialCode === dialCodeDigits);
}

function longestDialCodeMatch(e164Digits: string): PhoneCountry | undefined {
  // Prefer the longest dial code match.
  const matches = PHONE_COUNTRIES.filter((c) => e164Digits.startsWith(c.dialCode));
  if (matches.length === 0) return undefined;
  return matches.reduce((a, b) => (b.dialCode.length > a.dialCode.length ? b : a));
}

export function toE164(country: PhoneCountry, nationalDigitsRaw: string) {
  const nationalDigits = normalizeNationalDigits(country, nationalDigitsRaw);
  return `+${country.dialCode}${nationalDigits}`;
}

export function parsePhoneValue(
  raw: string | null | undefined,
  opts?: { defaultIso?: string }
): { country: PhoneCountry; nationalDigits: string; e164: string; rawWasE164: boolean } {
  const defaultIso = opts?.defaultIso ?? DEFAULT_PHONE_COUNTRY_ISO;
  const fallbackCountry = findCountryByIso(defaultIso) ?? PHONE_COUNTRIES[0]!;
  const s = String(raw ?? "").trim();
  if (!s) {
    return { country: fallbackCountry, nationalDigits: "", e164: `+${fallbackCountry.dialCode}`, rawWasE164: false };
  }

  const rawWasE164 = s.startsWith("+");
  if (rawWasE164) {
    const d = digitsOnly(s);
    const c = longestDialCodeMatch(d) ?? fallbackCountry;
    const nationalDigits = d.startsWith(c.dialCode) ? d.slice(c.dialCode.length) : d;
    return { country: c, nationalDigits, e164: toE164(c, nationalDigits), rawWasE164: true };
  }

  // Legacy: store national digits only (optionally with leading 0). We keep digits and let UI enforce length.
  const d = digitsOnly(s);
  return { country: fallbackCountry, nationalDigits: d, e164: toE164(fallbackCountry, d), rawWasE164: false };
}

/**
 * Users often type a leading trunk prefix "0" (e.g. EG: 010..., SA: 05...).
 * E.164 must not include this trunk "0". If removing a single leading "0" produces a valid national length,
 * we normalize by dropping it.
 */
export function normalizeNationalDigits(country: PhoneCountry, nationalDigitsRaw: string) {
  const d = digitsOnly(nationalDigitsRaw);
  if (!d) return "";
  if (!d.startsWith("0")) return d;
  const once = d.slice(1);
  if (once.length >= country.minDigits && once.length <= country.maxDigits) return once;
  return d;
}

export function isValidNationalDigits(country: PhoneCountry, nationalDigitsRaw: string) {
  const d = normalizeNationalDigits(country, nationalDigitsRaw);
  return d.length >= country.minDigits && d.length <= country.maxDigits;
}

export function normalizeAndValidateE164(
  raw: string | null | undefined,
  opts?: { defaultIso?: string }
): { ok: true; e164: string; country: PhoneCountry; nationalDigits: string } | { ok: false; reason: "EMPTY" | "INVALID_COUNTRY" | "INVALID_LENGTH" } {
  const s = String(raw ?? "").trim();
  if (!s) return { ok: false, reason: "EMPTY" };

  const { country, nationalDigits: nationalDigitsRaw } = parsePhoneValue(s, { defaultIso: opts?.defaultIso });
  if (!country) return { ok: false, reason: "INVALID_COUNTRY" };
  const nationalDigits = normalizeNationalDigits(country, nationalDigitsRaw);
  if (!isValidNationalDigits(country, nationalDigits)) return { ok: false, reason: "INVALID_LENGTH" };
  return { ok: true, e164: toE164(country, nationalDigits), country, nationalDigits };
}

