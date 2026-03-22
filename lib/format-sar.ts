import Tafgeet from "tafgeetjs";
import { toWords } from "to-words/en-US";
import type { AppLocale } from "@/lib/i18n/config";
import { AR_LOCALE_LATN } from "@/lib/locale";

/** SAR amount with digits + currency (locale-aware: ar = ‎ر.س‎ style, en = SAR prefix). */
export function formatSarAmount(amount: number, locale: AppLocale = "ar"): string {
  const n = Math.round(amount);
  try {
    const loc = locale === "en" ? "en-SA" : AR_LOCALE_LATN;
    return new Intl.NumberFormat(loc, {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return locale === "en" ? `${n} SAR` : `${n} ر.س`;
  }
}

/** Amount written out: Arabic (Tafgeet) or English (e.g. "One Thousand Five Hundred Saudi Riyals"). */
export function sarAmountInWords(amount: number, locale: AppLocale = "ar"): string {
  const n = Math.round(amount);
  if (!Number.isFinite(n) || n < 0 || n > 999999999999999) return "";

  if (locale === "en") {
    try {
      const words = toWords(n);
      if (n === 1) return `${words} Saudi Riyal`;
      return `${words} Saudi Riyals`;
    } catch {
      return "";
    }
  }

  try {
    return new Tafgeet(n, "SAR").parse();
  } catch {
    return "";
  }
}
