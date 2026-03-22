import { AR_LOCALE_LATN } from "@/lib/locale";

/** Saudi Arabia — keeps server (Node) and client formatting aligned for the same instant. */
const DASHBOARD_TIMEZONE = "Asia/Riyadh";

/**
 * Datetime for dashboard lists/cards. Uses explicit `Intl` options + timezone so
 * output matches between Node SSR and the browser (avoids ar-SA punctuation drift).
 */
export function formatDashboardDateTime(
  iso: string | number | Date | null | undefined,
  locale: "ar" | "en",
): string {
  if (iso == null || iso === "") return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const loc = locale === "ar" ? AR_LOCALE_LATN : "en-GB";
  return new Intl.DateTimeFormat(loc, {
    timeZone: DASHBOARD_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
    numberingSystem: "latn",
  }).format(d);
}
