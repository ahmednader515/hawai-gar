"use client";

import type { AppLocale } from "@/lib/i18n/config";
import { SarPriceDisplay } from "@/components/sar-price-display";
import { useI18n } from "@/components/providers/i18n-provider";

const amountClass =
  "font-semibold tabular-nums text-amber-950 dark:text-amber-50 text-base sm:text-lg";
const wordsClass =
  "mt-2 text-xs sm:text-sm font-medium text-amber-900/95 dark:text-amber-100/90 leading-relaxed [text-wrap:pretty]";

type Props = {
  estimatedPriceSar: number;
  priceSar: number;
  locale: AppLocale;
  /** Slightly tighter padding when nested in dense layouts (e.g. dashboard cards). */
  compact?: boolean;
};

/**
 * Shows admin price adjustment: intro + previous estimate (number + words) + connector + final (number + words).
 * Stacked layout avoids overlapping Arabic tafqeet lines from inline blocks.
 */
export function ShipmentPriceChangeAlert({ estimatedPriceSar, priceSar, locale, compact }: Props) {
  const { t } = useI18n();

  return (
    <div
      className={
        compact
          ? "rounded-lg border border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100 p-3 sm:p-4 text-sm"
          : "rounded-xl border border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100 p-4 text-sm"
      }
    >
      <p className="font-medium leading-relaxed [text-wrap:pretty]">{t("hero.priceChanged")}</p>

      <div className="mt-4 space-y-4">
        <div className="rounded-lg border border-amber-200/70 bg-white/70 p-3 shadow-sm dark:border-amber-800/50 dark:bg-amber-950/40">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200/90">
            {t("hero.priceChangePreviousLabel")}
          </p>
          <SarPriceDisplay
            amount={estimatedPriceSar}
            locale={locale}
            className="space-y-0"
            amountClassName={amountClass}
            wordsClassName={wordsClass}
          />
        </div>

        <div className="flex justify-center py-0.5" role="separator" aria-hidden>
          <span className="inline-flex min-w-[3rem] items-center justify-center rounded-full bg-amber-200/90 px-4 py-1.5 text-xs font-bold text-amber-950 shadow-sm dark:bg-amber-800 dark:text-amber-50">
            {t("hero.priceConnector")}
          </span>
        </div>

        <div className="rounded-lg border border-amber-200/70 bg-white/70 p-3 shadow-sm dark:border-amber-800/50 dark:bg-amber-950/40">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200/90">
            {t("hero.priceChangeFinalLabel")}
          </p>
          <SarPriceDisplay
            amount={priceSar}
            locale={locale}
            className="space-y-0"
            amountClassName={amountClass}
            wordsClassName={wordsClass}
          />
        </div>
      </div>
    </div>
  );
}
