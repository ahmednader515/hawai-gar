import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE, type AppLocale } from "@/lib/i18n/config";

export async function POST(request: Request) {
  let locale: AppLocale = DEFAULT_LOCALE;
  try {
    const body = await request.json();
    const raw = body?.locale;
    if (isAppLocale(raw)) locale = raw;
  } catch {
    /* ignore */
  }

  const res = NextResponse.json({ ok: true, locale });
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
