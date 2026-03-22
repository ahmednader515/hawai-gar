"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";

type Props = {
  id: string;
  className?: string;
  /** حجم أصغر للكروت المضغوطة */
  compact?: boolean;
};

export function CopyableRequestId({ id, className, compact }: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex w-full justify-start">
      <div
        className={cn(
          "rounded-xl border-2 border-primary/30 bg-primary/[0.07] shadow-sm",
          /* أضيق من عرض البطاقة، ملاصق لليمين في الواجهة العربية */
          "w-full max-w-sm min-w-0",
          compact ? "p-2.5 sm:p-3" : "p-3 sm:p-4",
          className,
        )}
      >
      <div
        className={cn(
          "font-bold text-primary text-start",
          compact ? "text-sm mb-2" : "text-base mb-2",
        )}
      >
        {t("copyableRequestId.label")}
      </div>
      <div className="flex items-start gap-2 min-w-0 justify-start">
        <code
          dir="ltr"
          className={cn(
            "min-w-0 flex-1 break-all font-mono text-foreground leading-snug text-end",
            compact ? "text-base sm:text-lg font-bold tracking-wide" : "text-lg sm:text-xl font-bold tracking-wide",
          )}
          title={id}
        >
          {id}
        </code>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "shrink-0 rounded-lg border border-border bg-card px-2.5 py-2 text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground active:scale-[0.98]",
            copied && "border-primary/60 text-primary bg-primary/10",
          )}
          aria-label={copied ? t("copyableRequestId.copiedAria") : t("copyableRequestId.copyAria")}
        >
          {copied ? <Check className="h-5 w-5" aria-hidden /> : <Copy className="h-5 w-5" aria-hidden />}
        </button>
      </div>
      {copied ? (
        <p className="mt-2 text-xs font-medium text-primary text-start" role="status">
          {t("copyableRequestId.copied")}
        </p>
      ) : null}
      </div>
    </div>
  );
}
