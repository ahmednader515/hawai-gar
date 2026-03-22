/**
 * Arabic (Saudi Arabia) with Western digits (0–9), never Arabic-Indic numerals.
 * Use for Intl.NumberFormat, Date#toLocaleString / toLocaleDateString, etc.
 */
export const AR_LOCALE_LATN = "ar-SA-u-nu-latn";

/** Explicit Latin digits for non-Arabic locale formatters (e.g. en-GB dates). */
export const LATN_NUMBERING: Intl.DateTimeFormatOptions = {
  numberingSystem: "latn",
};
