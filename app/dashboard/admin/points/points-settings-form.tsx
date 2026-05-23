"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PointsSettings } from "@/lib/points-settings";
import { useI18n } from "@/components/providers/i18n-provider";

function parseNonNegativeInt(raw: string): number | null {
  const s = raw.trim();
  if (!s) return 0;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function PointsSettingsForm({ initial }: { initial: PointsSettings }) {
  const { t } = useI18n();
  const [carrierPoints, setCarrierPoints] = useState(String(initial.carrierPoints));
  const [companyPoints, setCompanyPoints] = useState(String(initial.companyPoints));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const carrier = parseNonNegativeInt(carrierPoints);
    const company = parseNonNegativeInt(companyPoints);
    if (carrier === null || company === null) {
      setError(t("dashboard.admin.pointsInvalid"));
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/points", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrierPoints: carrier, companyPoints: company }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : t("dashboard.admin.pointsSaveError"));
        return;
      }
      setCarrierPoints(String(data.carrierPoints ?? carrier));
      setCompanyPoints(String(data.companyPoints ?? company));
      setSaved(true);
    } catch {
      setError(t("dashboard.admin.pointsSaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md space-y-6 rounded-xl border border-border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="points-carrier">{t("dashboard.admin.pointsCarrierLabel")}</Label>
        <Input
          id="points-carrier"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={carrierPoints}
          onChange={(e) => setCarrierPoints(e.target.value)}
          className="tabular-nums"
        />
        <p className="text-xs text-muted-foreground">{t("dashboard.admin.pointsCarrierHint")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="points-company">{t("dashboard.admin.pointsCompanyLabel")}</Label>
        <Input
          id="points-company"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={companyPoints}
          onChange={(e) => setCompanyPoints(e.target.value)}
          className="tabular-nums"
        />
        <p className="text-xs text-muted-foreground">{t("dashboard.admin.pointsCompanyHint")}</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{t("dashboard.admin.pointsSaved")}</p> : null}
      <Button type="button" onClick={() => void handleSave()} disabled={saving}>
        {saving ? t("dashboard.admin.pricingSaving") : t("dashboard.admin.pointsSave")}
      </Button>
    </div>
  );
}
