"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/lib/i18n/config";

type Variant = "default" | "hero" | "subtle";

const variantClasses: Record<Variant, { wrap: string; active: string; inactive: string }> = {
  default: {
    wrap: "border-border bg-muted/60",
    active: "bg-primary text-primary-foreground shadow-sm",
    inactive: "text-muted-foreground hover:text-foreground hover:bg-muted",
  },
  hero: {
    wrap: "border-white/35 bg-black/25 backdrop-blur-sm",
    active: "bg-white text-foreground shadow-sm",
    inactive: "text-white/90 hover:bg-white/15",
  },
  subtle: {
    wrap: "border-gray-200 bg-white",
    active: "bg-primary text-primary-foreground",
    inactive: "text-muted-foreground hover:bg-gray-50",
  },
};

export function LanguageSwitcher({ variant = "default", className }: { variant?: Variant; className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const v = variantClasses[variant];

  const btn = (loc: AppLocale, label: string) => (
    <button
      type="button"
      onClick={() => void setLocale(loc)}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors min-h-[32px] min-w-[2.5rem]",
        locale === loc ? v.active : v.inactive,
      )}
      aria-pressed={locale === loc}
    >
      {label}
    </button>
  );

  return (
    <div
      className={cn("inline-flex items-center gap-0.5 rounded-lg border p-0.5", v.wrap, className)}
      role="group"
      aria-label={t("language.switchAria")}
    >
      {btn("ar", t("language.arabicShort"))}
      {btn("en", t("language.englishShort"))}
    </div>
  );
}
