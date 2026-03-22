export const LOCALE_COOKIE = "NEXT_LOCALE";

export const SUPPORTED_LOCALES = ["ar", "en"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "ar";

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === "ar" || value === "en";
}
