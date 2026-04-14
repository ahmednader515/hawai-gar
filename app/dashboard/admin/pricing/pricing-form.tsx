"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShipmentPricingSettings } from "@/lib/shipment-pricing";
import { useI18n } from "@/components/providers/i18n-provider";
import { TRUCK_SIZE_OPTIONS, TRUCK_TYPE_OPTIONS_BY_SIZE } from "@/lib/truck-options";

export function AdminPricingForm({ initial }: { initial: ShipmentPricingSettings }) {
  const { t } = useI18n();
  const [sarPerKm, setSarPerKm] = useState(String(initial.sarPerKm));
  const [multiplier, setMultiplier] = useState(String(initial.multiplier));
  const [distanceMultiplier, setDistanceMultiplier] = useState(String(initial.distanceMultiplier ?? 1));
  const [detailsNote, setDetailsNote] = useState(initial.detailsNote ?? "");
  const [modShipmentTypeSar, setModShipmentTypeSar] = useState<Record<string, string>>({});
  const [modShipmentTypePct, setModShipmentTypePct] = useState<Record<string, string>>({});
  const [modTruckSizeSar, setModTruckSizeSar] = useState<Record<string, string>>({});
  const [modTruckSizePct, setModTruckSizePct] = useState<Record<string, string>>({});
  const [modTruckTypeSar, setModTruckTypeSar] = useState<Record<string, string>>({});
  const [modTruckTypePct, setModTruckTypePct] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const shipmentTypeOptions = [
    "قابل للكسر",
    "مواد غذائية",
    "مواد كيميائية",
    "أجهزة إلكترونية",
    "مواد بناء",
    "أخرى",
  ];
  const truckSizeOptions = TRUCK_SIZE_OPTIONS.map((o) => o.value);
  const truckTypeOptions = Array.from(
    new Set(Object.values(TRUCK_TYPE_OPTIONS_BY_SIZE).flat().map((o) => o.value)),
  );

  useEffect(() => {
    setSarPerKm(String(initial.sarPerKm));
    setMultiplier(String(initial.multiplier));
    setDistanceMultiplier(String(initial.distanceMultiplier ?? 1));
    setDetailsNote(initial.detailsNote ?? "");
    setModShipmentTypeSar(Object.fromEntries(shipmentTypeOptions.map((k) => [k, String(initial.modifiers?.shipmentType?.[k]?.addSar ?? 0)])));
    setModShipmentTypePct(Object.fromEntries(shipmentTypeOptions.map((k) => [k, String(initial.modifiers?.shipmentType?.[k]?.pct ?? 0)])));
    setModTruckSizeSar(Object.fromEntries(truckSizeOptions.map((k) => [k, String(initial.modifiers?.truckSize?.[k]?.addSar ?? 0)])));
    setModTruckSizePct(Object.fromEntries(truckSizeOptions.map((k) => [k, String(initial.modifiers?.truckSize?.[k]?.pct ?? 0)])));
    setModTruckTypeSar(Object.fromEntries(truckTypeOptions.map((k) => [k, String(initial.modifiers?.truckType?.[k]?.addSar ?? 0)])));
    setModTruckTypePct(Object.fromEntries(truckTypeOptions.map((k) => [k, String(initial.modifiers?.truckType?.[k]?.pct ?? 0)])));
  }, [initial.sarPerKm, initial.multiplier, initial.detailsNote]);

  useEffect(() => {
    // Ensure we initialize modifiers once even if initial effect doesn't run (TS/React strict).
    if (Object.keys(modShipmentTypeSar).length === 0) {
      setModShipmentTypeSar(Object.fromEntries(shipmentTypeOptions.map((k) => [k, "0"])));
      setModShipmentTypePct(Object.fromEntries(shipmentTypeOptions.map((k) => [k, "0"])));
      setModTruckSizeSar(Object.fromEntries(truckSizeOptions.map((k) => [k, "0"])));
      setModTruckSizePct(Object.fromEntries(truckSizeOptions.map((k) => [k, "0"])));
      setModTruckTypeSar(Object.fromEntries(truckTypeOptions.map((k) => [k, "0"])));
      setModTruckTypePct(Object.fromEntries(truckTypeOptions.map((k) => [k, "0"])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapToNumber = (obj: Record<string, string>) => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(obj)) {
      const n = parseFloat(String(v).trim().replace(",", "."));
      out[k] = Number.isFinite(n) && n >= 0 ? n : 0;
    }
    return out;
  };

  const mergeValueMaps = (sarMap: Record<string, string>, pctMap: Record<string, string>) => {
    const keys = new Set([...Object.keys(sarMap), ...Object.keys(pctMap)]);
    const out: Record<string, { addSar: number; pct: number }> = {};
    for (const k of keys) {
      const addSar = parseFloat(String(sarMap[k] ?? "0").trim().replace(",", "."));
      const pct = parseFloat(String(pctMap[k] ?? "0").trim().replace(",", "."));
      out[k] = {
        addSar: Number.isFinite(addSar) && addSar >= 0 ? addSar : 0,
        pct: Number.isFinite(pct) && pct >= 0 ? pct : 0,
      };
    }
    return out;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const sar = parseFloat(sarPerKm.replace(",", "."));
      const mult = parseFloat(multiplier.replace(",", "."));
      const distMult = parseFloat(distanceMultiplier.replace(",", "."));
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sarPerKm: sar,
          multiplier: mult,
          distanceMultiplier: distMult,
          detailsNote: detailsNote.trim() || null,
          modifiers: {
            shipmentType: mergeValueMaps(modShipmentTypeSar, modShipmentTypePct),
            truckSize: mergeValueMaps(modTruckSizeSar, modTruckSizePct),
            truckType: mergeValueMaps(modTruckTypeSar, modTruckTypePct),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? t("dashboard.admin.pricingSaveError") });
        return;
      }
      if (typeof data.sarPerKm === "number") setSarPerKm(String(data.sarPerKm));
      if (typeof data.multiplier === "number") setMultiplier(String(data.multiplier));
      if (typeof data.distanceMultiplier === "number") setDistanceMultiplier(String(data.distanceMultiplier));
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
        <div className="space-y-2">
          <Label htmlFor="pricing-distance-mult">{t("dashboard.admin.pricingDistanceMultiplierLabel")}</Label>
          <Input
            id="pricing-distance-mult"
            inputMode="decimal"
            value={distanceMultiplier}
            onChange={(e) => setDistanceMultiplier(e.target.value)}
            className="h-11"
            required
          />
          <p className="text-xs text-muted-foreground">{t("dashboard.admin.pricingDistanceMultiplierHint")}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("dashboard.admin.pricingModifiersTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("dashboard.admin.pricingModifiersHint")}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{t("dashboard.admin.pricingModifiersShipmentType")}</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {shipmentTypeOptions.map((k) => (
              <div key={`st-${k}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                <span className="text-sm text-foreground">{k}</span>
                <div className="flex items-center gap-2">
                  <Input
                    inputMode="decimal"
                    value={modShipmentTypeSar[k] ?? "0"}
                    onChange={(e) => setModShipmentTypeSar((prev) => ({ ...prev, [k]: e.target.value }))}
                    className="h-9 w-24 text-right tabular-nums"
                    aria-label={`${k} add SAR`}
                  />
                  <Input
                    inputMode="decimal"
                    value={modShipmentTypePct[k] ?? "0"}
                    onChange={(e) => setModShipmentTypePct((prev) => ({ ...prev, [k]: e.target.value }))}
                    className="h-9 w-20 text-right tabular-nums"
                    aria-label={`${k} percent`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{t("dashboard.admin.pricingModifiersTruckSize")}</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {truckSizeOptions.map((k) => (
              <div key={`ts-${k}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                <span className="text-sm text-foreground">{k}</span>
                <div className="flex items-center gap-2">
                  <Input
                    inputMode="decimal"
                    value={modTruckSizeSar[k] ?? "0"}
                    onChange={(e) => setModTruckSizeSar((prev) => ({ ...prev, [k]: e.target.value }))}
                    className="h-9 w-24 text-right tabular-nums"
                    aria-label={`${k} add SAR`}
                  />
                  <Input
                    inputMode="decimal"
                    value={modTruckSizePct[k] ?? "0"}
                    onChange={(e) => setModTruckSizePct((prev) => ({ ...prev, [k]: e.target.value }))}
                    className="h-9 w-20 text-right tabular-nums"
                    aria-label={`${k} percent`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{t("dashboard.admin.pricingModifiersTruckType")}</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {truckTypeOptions.map((k) => (
              <div key={`tt-${k}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                <span className="text-sm text-foreground">{k}</span>
                <div className="flex items-center gap-2">
                  <Input
                    inputMode="decimal"
                    value={modTruckTypeSar[k] ?? "0"}
                    onChange={(e) => setModTruckTypeSar((prev) => ({ ...prev, [k]: e.target.value }))}
                    className="h-9 w-24 text-right tabular-nums"
                    aria-label={`${k} add SAR`}
                  />
                  <Input
                    inputMode="decimal"
                    value={modTruckTypePct[k] ?? "0"}
                    onChange={(e) => setModTruckTypePct((prev) => ({ ...prev, [k]: e.target.value }))}
                    className="h-9 w-20 text-right tabular-nums"
                    aria-label={`${k} percent`}
                  />
                </div>
              </div>
            ))}
          </div>
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
