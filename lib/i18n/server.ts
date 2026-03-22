import { cookies } from "next/headers";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import { DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE, type AppLocale } from "@/lib/i18n/config";
import { getMessage } from "@/lib/i18n/get-message";

export async function getLocale(): Promise<AppLocale> {
  const c = await cookies();
  const raw = c.get(LOCALE_COOKIE)?.value;
  return isAppLocale(raw) ? raw : DEFAULT_LOCALE;
}

/** ترجمة النصوص الثابتة في صفحات السيرفر */
export async function getTranslations() {
  const locale = await getLocale();
  const messages = (locale === "en" ? en : ar) as Record<string, unknown>;
  return function t(key: string) {
    return getMessage(messages, key);
  };
}
