"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { DirectionProvider as RadixDirectionProvider } from "@radix-ui/react-direction";
import { getMessage } from "@/lib/i18n/get-message";
import type { AppLocale } from "@/lib/i18n/config";

export type MessagesRecord = Record<string, unknown>;

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => Promise<void>;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  locale: serverLocale,
  messagesByLocale,
}: {
  children: ReactNode;
  locale: AppLocale;
  messagesByLocale: { ar: MessagesRecord; en: MessagesRecord };
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<AppLocale>(serverLocale);

  useEffect(() => {
    setLocaleState(serverLocale);
  }, [serverLocale]);

  const setLocale = useCallback(
    async (next: AppLocale) => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      setLocaleState(next);
      router.refresh();
    },
    [router],
  );

  const t = useCallback(
    (key: string) => getMessage(messagesByLocale[locale], key),
    [locale, messagesByLocale],
  );

  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale === "ar" ? "ar" : "en";
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <I18nContext.Provider value={value}>
      <RadixDirectionProvider dir={dir}>{children}</RadixDirectionProvider>
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
