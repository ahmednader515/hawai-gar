"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/i18n-provider";

function nextSearch(params: Record<string, string | null | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || String(v).trim() === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function AnalyticsFilters({
  current,
}: {
  current: { days?: string; month?: string; week?: string };
}) {
  const router = useRouter();
  const { t } = useI18n();
  const initialMode = useMemo(() => {
    if (current.month) return "month";
    if (current.week) return "week";
    return "range";
  }, [current.month, current.week]);

  const [mode, setMode] = useState<"range" | "month" | "week">(initialMode as any);
  const [month, setMonth] = useState(current.month ?? "");
  const [week, setWeek] = useState(current.week ?? "");

  const applyRange = (days: string) => {
    router.push(`/dashboard/admin/analytics${nextSearch({ days, month: null, week: null })}`);
  };

  const applyMonth = (m: string) => {
    router.push(`/dashboard/admin/analytics${nextSearch({ month: m, week: null, days: null })}`);
  };

  const applyWeek = (w: string) => {
    router.push(`/dashboard/admin/analytics${nextSearch({ week: w, month: null, days: null })}`);
  };

  const onReset = async () => {
    try {
      await fetch("/api/admin/analytics/reset", { method: "POST" });
    } finally {
      router.push("/dashboard/admin/analytics?days=all");
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("range");
            applyRange(current.days ?? "30");
          }}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
            mode === "range" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
          }`}
        >
          {t("dashboard.admin.analyticsModeRange")}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("month");
            if (month) applyMonth(month);
          }}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
            mode === "month" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
          }`}
        >
          {t("dashboard.admin.analyticsModeMonth")}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("week");
            if (week) applyWeek(week);
          }}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
            mode === "week" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
          }`}
        >
          {t("dashboard.admin.analyticsModeWeek")}
        </button>

        <Button type="button" variant="secondary" size="sm" className="h-8 rounded-full" onClick={() => void onReset()}>
          {t("dashboard.admin.analyticsReset")}
        </Button>
      </div>

      {mode === "range" ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyRange("7")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              (current.days ?? "30") === "7"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted"
            }`}
          >
            {t("dashboard.admin.analyticsRange7")}
          </button>
          <button
            type="button"
            onClick={() => applyRange("30")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              (current.days ?? "30") === "30"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted"
            }`}
          >
            {t("dashboard.admin.analyticsRange30")}
          </button>
          <button
            type="button"
            onClick={() => applyRange("90")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              (current.days ?? "30") === "90"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted"
            }`}
          >
            {t("dashboard.admin.analyticsRange90")}
          </button>
          <button
            type="button"
            onClick={() => applyRange("365")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              (current.days ?? "30") === "365"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted"
            }`}
          >
            {t("dashboard.admin.analyticsRange365")}
          </button>
          <button
            type="button"
            onClick={() => applyRange("all")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              (current.days ?? "") === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted"
            }`}
          >
            {t("dashboard.admin.analyticsRangeAllChip")}
          </button>
        </div>
      ) : mode === "month" ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            {t("dashboard.admin.analyticsPickMonth")}
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => {
              const v = e.target.value;
              setMonth(v);
              if (v) applyMonth(v);
            }}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            {t("dashboard.admin.analyticsPickWeek")}
          </label>
          <input
            type="week"
            value={week}
            onChange={(e) => {
              const v = e.target.value;
              setWeek(v);
              if (v) applyWeek(v);
            }}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
      )}
    </div>
  );
}

