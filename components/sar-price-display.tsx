import type { AppLocale } from "@/lib/i18n/config";
import { formatSarAmount, sarAmountInWords } from "@/lib/format-sar";

type SarPriceDisplayProps = {
  amount: number;
  /** Defaults to Arabic words; use `en` for English amount in words + SAR formatting. */
  locale?: AppLocale;
  className?: string;
  amountClassName?: string;
  wordsClassName?: string;
};

/** رقم السعر + السطر الثاني بالتفقيط (عربي أو إنجليزي حسب اللغة) */
export function SarPriceDisplay({
  amount,
  locale = "ar",
  className,
  amountClassName = "font-semibold tabular-nums text-primary",
  wordsClassName = "text-sm sm:text-base font-medium text-foreground/90 mt-1.5 leading-relaxed",
}: SarPriceDisplayProps) {
  const words = sarAmountInWords(amount, locale);
  return (
    <div className={className}>
      <div className={amountClassName}>{formatSarAmount(amount, locale)}</div>
      {words ? <div className={wordsClassName}>{words}</div> : null}
    </div>
  );
}

/** داخل جملة (مثلاً: من … إلى …) — رقم + تفقيط تحته بشكل مضغوط */
export function SarPriceInline({ amount, locale = "ar" }: { amount: number; locale?: AppLocale }) {
  const words = sarAmountInWords(amount, locale);
  return (
    <span className="inline-block align-top text-start max-w-full">
      <span className="font-semibold tabular-nums">{formatSarAmount(amount, locale)}</span>
      {words ? (
        <span className="block text-sm sm:text-base font-medium text-foreground/90 mt-1 leading-relaxed">
          {words}
        </span>
      ) : null}
    </span>
  );
}
