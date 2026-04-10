"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShipmentPricingSettings } from "@/lib/shipment-pricing";
import { useI18n } from "@/components/providers/i18n-provider";

export function AdminPricingForm({ initial }: { initial: ShipmentPricingSettings }) {
  const { t } = useI18n();
  const [sarPerKm, setSarPerKm] = useState(String(initial.sarPerKm));
  const [multiplier, setMultiplier] = useState(String(initial.multiplier));
  const [detailsNote, setDetailsNote] = useState(initial.detailsNote ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setSarPerKm(String(initial.sarPerKm));
    setMultiplier(String(initial.multiplier));
    setDetailsNote(initial.detailsNote ?? "");
  }, [initial.sarPerKm, initial.multiplier, initial.detailsNote]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const sar = parseFloat(sarPerKm.replace(",", "."));
      const mult = parseFloat(multiplier.replace(",", "."));
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sarPerKm: sar,
          multiplier: mult,
          detailsNote: detailsNote.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? t("dashboard.admin.pricingSaveError") });
        return;
      }
      if (typeof data.sarPerKm === "number") setSarPerKm(String(data.sarPerKm));
      if (typeof data.multiplier === "number") setMultiplier(String(data.multiplier));
      setDetailsNote(typeof data.detailsNote === "string" ? data.detailsNote : "");
      setMessage({ type: "success", text: t("dashboard.admin.pricingSaveSuccess") });
    } catch {
      setMessage({ type: "error", text: t("dashboard.admin.pricingGenericError") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-xl">
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pricing-sar-km">{t("dashboard.admin.pricingSarPerKmLabel")}</Label>
          <Input
            id="pricing-sar-km"
            inputMode="decimal"
            value={sarPerKm}
            onChange={(e) => setSarPerKm(e.target.value)}
            className="h-11"
            required
          />
          <p className="text-xs text-muted-foreground">{t("dashboard.admin.pricingSarPerKmHint")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricing-multiplier">{t("dashboard.admin.pricingMultiplierLabel")}</Label>
          <Input
            id="pricing-multiplier"
            inputMode="decimal"
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
            className="h-11"
            required
          />
          <p className="text-xs text-muted-foreground">{t("dashboard.admin.pricingMultiplierHint")}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pricing-details">{t("dashboard.admin.pricingDetailsLabel")}</Label>
        <textarea
          id="pricing-details"
          value={detailsNote}
          onChange={(e) => setDetailsNote(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder={t("dashboard.admin.pricingDetailsPlaceholder")}
        />
        <p className="text-xs text-muted-foreground">{t("dashboard.admin.pricingDetailsHint")}</p>
      </div>

      {message && (
        <p
          className={`text-sm p-3 rounded-lg ${
            message.type === "success" ? "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200" : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
          }`}
        >
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
        {saving ? t("dashboard.admin.pricingSaving") : t("dashboard.admin.pricingSave")}
      </Button>
    </form>
  );
}
