import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { NavigationLoading } from "@/components/navigation-loading";
import { SessionProvider } from "@/components/providers/session-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from "@/lib/i18n/config";
import type { MessagesRecord } from "@/components/providers/i18n-provider";
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";

export const metadata: Metadata = {
  title: "hawai Logisti",
  description: "ربط شركات الشحن (بين مواني ومدن المملكة والخليج) بشركات النقل في المملكة العربية السعودية",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: AppLocale = isAppLocale(raw) ? raw : DEFAULT_LOCALE;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const lang = locale === "ar" ? "ar" : "en";

  const messagesByLocale = {
    ar: arMessages as MessagesRecord,
    en: enMessages as MessagesRecord,
  };

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SessionProvider>
          <I18nProvider locale={locale} messagesByLocale={messagesByLocale}>
            <NavigationLoading />
            {children}
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
