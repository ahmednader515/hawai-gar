"use client";

import { Star } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function PointsBalanceBadge({
  balance,
  className,
  variant = "default",
}: {
  balance: number;
  className?: string;
  variant?: "default" | "hero" | "compact";
}) {
  const { t } = useI18n();
  const label = t("dashboard.client.pointsBalance").replace("{count}", balance.toLocaleString());

  if (variant === "hero") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary shrink-0",
          className,
        )}
        title={label}
      >
        <Star className="h-4 w-4 fill-primary/20 text-primary" aria-hidden />
        <span className="tabular-nums">{balance.toLocaleString()}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100",
        variant === "compact" && "px-2 py-0.5 text-[0.7rem]",
        className,
      )}
      title={label}
    >
      <Star className={cn("h-3.5 w-3.5 shrink-0", variant === "compact" && "h-3 w-3")} aria-hidden />
      <span className="tabular-nums">{balance.toLocaleString()}</span>
    </span>
  );
}
