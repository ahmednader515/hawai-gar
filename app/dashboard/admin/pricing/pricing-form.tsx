"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShipmentPricingSettings } from "@/lib/shipment-pricing";
import { useI18n } from "@/components/providers/i18n-provider";
import { TRUCK_SIZE_OPTIONS, TRUCK_TYPE_OPTIONS_BY_SIZE } from "@/lib/truck-options";

function parseNonNeg(raw: string | undefined) {
  const n = parseFloat(String(raw ?? "").trim().replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function clampPercentString(raw: string) {
  const s = String(raw ?? "");
  if (!s.trim()) return "0";
  const normalized = s.replace(",", ".");
  const n = parseNonNeg(normalized);
  const clamped = Math.min(100, n);
  // Preserve user typing a trailing decimal separator (e.g. "10.")
  if (/[.,]$/.test(s) && n <= 100) return normalized;
  return String(clamped);
}

function PercentInput({
  value,
  onValueChange,
  disabled,
  ariaLabel,
  className,
}: {
  value: string;
  onValueChange: (next: string) => void;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className="relative">
      <Input
        id="pricing-profit"
        inputMode="decimal"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onValueChange(clampPercentString(e.target.value))}
        className={className ?? "h-9 w-20 text-right tabular-nums pe-6"}
        aria-label={ariaLabel}
        disabled={disabled}
      />
      <span className="pointer-events-none absolute inset-y-0 end-2 flex items-center text-xs text-muted-foreground">
        %
      </span>
    </div>
  );
}

export function AdminPricingForm({ initial }: { initial: ShipmentPricingSettings }) {
  const { t } = useI18n();
  const [sarPerKm, setSarPerKm] = useState(String(initial.sarPerKm));
  const [kmPerPriceUnit, setKmPerPriceUnit] = useState(String(initial.kmPerPriceUnit ?? 1));
  const [companyProfitMarginPct, setCompanyProfitMarginPct] = useState(String(initial.companyProfitMarginPct ?? 0));
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
    setKmPerPriceUnit(String(initial.kmPerPriceUnit ?? 1));
    setCompanyProfitMarginPct(String(initial.companyProfitMarginPct ?? 0));
    setDetailsNote(initial.detailsNote ?? "");
    setModShipmentTypeSar(Object.fromEntries(shipmentTypeOptions.map((k) => [k, String(initial.modifiers?.shipmentType?.[k]?.addSar ?? 0)])));
    setModShipmentTypePct(Object.fromEntries(shipmentTypeOptions.map((k) => [k, String(initial.modifiers?.shipmentType?.[k]?.pct ?? 0)])));
    setModTruckSizeSar(Object.fromEntries(truckSizeOptions.map((k) => [k, String(initial.modifiers?.truckSize?.[k]?.addSar ?? 0)])));
    setModTruckSizePct(Object.fromEntries(truckSizeOptions.map((k) => [k, String(initial.modifiers?.truckSize?.[k]?.pct ?? 0)])));
    setModTruckTypeSar(Object.fromEntries(truckTypeOptions.map((k) => [k, String(initial.modifiers?.truckType?.[k]?.addSar ?? 0)])));
    setModTruckTypePct(Object.fromEntries(truckTypeOptions.map((k) => [k, String(initial.modifiers?.truckType?.[k]?.pct ?? 0)])));
  }, [initial.sarPerKm, initial.kmPerPriceUnit, initial.companyProfitMarginPct, initial.detailsNote]);

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

  const hasPositiveValue = (raw: string | undefined) => parseNonNeg(raw) > 0;

  const MoneyInput = ({
    value,
    onChange,
    ariaLabel,
    disabled,
  }: {
    value: string;
    onChange: (next: string) => void;
    ariaLabel: string;
    disabled?: boolean;
  }) => (
    <Input
      inputMode="decimal"
      placeholder="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-24 text-right tabular-nums"
      aria-label={ariaLabel}
      disabled={disabled}
    />
  );

  const ModifierRow = ({
    label,
    sarValue,
    pctValue,
    onSarChange,
    onPctChange,
  }: {
    label: string;
    sarValue: string;
    pctValue: string;
    onSarChange: (next: string) => void;
    onPctChange: (next: string) => void;
  }) => {
    const sarIsActive = hasPositiveValue(sarValue);
    const pctIsActive = hasPositiveValue(pctValue);
    return (
      <div className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-background px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{label}</div>
          <div className="text-[11px] text-muted-foreground sm:hidden">
            {t("dashboard.admin.pricingModifiersExclusiveHint")}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-xs text-muted-foreground sm:hidden">
            {t("dashboard.admin.pricingModifiersSarCol")}
          </span>
          <MoneyInput
            value={sarValue}
            onChange={(next) => {
              onSarChange(next);
              if (hasPositiveValue(next)) onPctChange("0");
            }}
            ariaLabel={`${label} add SAR`}
            disabled={pctIsActive}
          />
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-xs text-muted-foreground sm:hidden">
            {t("dashboard.admin.pricingModifiersPctCol")}
          </span>
          <PercentInput
            value={pctValue}
            onValueChange={(next) => {
              onPctChange(next);
              if (hasPositiveValue(next)) onSarChange("0");
            }}
            ariaLabel={`${label} percent`}
            disabled={sarIsActive}
            className="h-9 w-20 text-right tabular-nums pe-6"
          />
        </div>
      </div>
    );
  };

  const mergeValueMaps = (sarMap: Record<string, string>, pctMap: Record<string, string>) => {
    const keys = new Set([...Object.keys(sarMap), ...Object.keys(pctMap)]);
    const out: Record<string, { addSar: number; pct: number }> = {};
    for (const k of keys) {
      const addSar = parseNonNeg(sarMap[k]);
      const pct = parseNonNeg(pctMap[k]);

      // Mutually exclusive: either fixed SAR or percentage (not both).
      if (addSar > 0) {
        out[k] = { addSar, pct: 0 };
      } else if (pct > 0) {
        out[k] = { addSar: 0, pct };
      } else {
        out[k] = { addSar: 0, pct: 0 };
      }
    }
    return out;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const sar = parseFloat(sarPerKm.replace(",", "."));
      const kmUnit = parseFloat(kmPerPriceUnit.replace(",", "."));
      const profitPct = parseFloat(companyProfitMarginPct.replace(",", "."));
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sarPerKm: sar,
          kmPerPriceUnit: kmUnit,
          companyProfitMarginPct: profitPct,
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
      if (typeof data.kmPerPriceUnit === "number") setKmPerPriceUnit(String(data.kmPerPriceUnit));
      if (typeof data.companyProfitMarginPct === "number") setCompanyProfitMarginPct(String(data.companyProfitMarginPct));
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
          <div className="flex items-center gap-2">
            <Input
              id="pricing-sar-km"
              inputMode="decimal"
              value={sarPerKm}
              onChange={(e) => setSarPerKm(e.target.value)}
              className="h-11"
              required
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("dashboard.admin.pricingSarPerKmPerLabel")}</span>
              <Input
                inputMode="numeric"
                value={kmPerPriceUnit}
                onChange={(e) => setKmPerPriceUnit(e.target.value.replace(/[^\d.,]/g, ""))}
                className="h-9 w-16 text-right tabular-nums"
                aria-label={t("dashboard.admin.pricingKmPerUnitAria")}
                required
              />
              <span className="text-xs text-muted-foreground">{t("dashboard.admin.pricingSarPerKmPerSuffix")}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("dashboard.admin.pricingSarPerKmHint")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricing-profit">{t("dashboard.admin.pricingCompanyProfitMarginLabel")}</Label>
          <div className="flex items-center justify-between gap-3">
            <PercentInput
              value={companyProfitMarginPct}
              onValueChange={setCompanyProfitMarginPct}
              ariaLabel={t("dashboard.admin.pricingCompanyProfitMarginAria")}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("dashboard.admin.pricingCompanyProfitMarginHint")}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("dashboard.admin.pricingModifiersTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("dashboard.admin.pricingModifiersHint")}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{t("dashboard.admin.pricingModifiersShipmentType")}</h3>
          <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3 px-3">
            <div className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.pricingModifiersItemCol")}</div>
            <div className="text-xs font-medium text-muted-foreground text-right">{t("dashboard.admin.pricingModifiersSarCol")}</div>
            <div className="text-xs font-medium text-muted-foreground text-right">{t("dashboard.admin.pricingModifiersPctCol")}</div>
          </div>
          <div className="space-y-2">
            {shipmentTypeOptions.map((k) => (
              <ModifierRow
                key={`st-${k}`}
                label={k}
                sarValue={modShipmentTypeSar[k] ?? "0"}
                pctValue={modShipmentTypePct[k] ?? "0"}
                onSarChange={(next) => setModShipmentTypeSar((prev) => ({ ...prev, [k]: next }))}
                onPctChange={(next) => setModShipmentTypePct((prev) => ({ ...prev, [k]: next }))}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{t("dashboard.admin.pricingModifiersTruckSize")}</h3>
          <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3 px-3">
            <div className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.pricingModifiersItemCol")}</div>
            <div className="text-xs font-medium text-muted-foreground text-right">{t("dashboard.admin.pricingModifiersSarCol")}</div>
            <div className="text-xs font-medium text-muted-foreground text-right">{t("dashboard.admin.pricingModifiersPctCol")}</div>
          </div>
          <div className="space-y-2">
            {truckSizeOptions.map((k) => (
              <ModifierRow
                key={`ts-${k}`}
                label={k}
                sarValue={modTruckSizeSar[k] ?? "0"}
                pctValue={modTruckSizePct[k] ?? "0"}
                onSarChange={(next) => setModTruckSizeSar((prev) => ({ ...prev, [k]: next }))}
                onPctChange={(next) => setModTruckSizePct((prev) => ({ ...prev, [k]: next }))}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{t("dashboard.admin.pricingModifiersTruckType")}</h3>
          <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3 px-3">
            <div className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.pricingModifiersItemCol")}</div>
            <div className="text-xs font-medium text-muted-foreground text-right">{t("dashboard.admin.pricingModifiersSarCol")}</div>
            <div className="text-xs font-medium text-muted-foreground text-right">{t("dashboard.admin.pricingModifiersPctCol")}</div>
          </div>
          <div className="space-y-2">
            {truckTypeOptions.map((k) => (
              <ModifierRow
                key={`tt-${k}`}
                label={k}
                sarValue={modTruckTypeSar[k] ?? "0"}
                pctValue={modTruckTypePct[k] ?? "0"}
                onSarChange={(next) => setModTruckTypeSar((prev) => ({ ...prev, [k]: next }))}
                onPctChange={(next) => setModTruckTypePct((prev) => ({ ...prev, [k]: next }))}
              />
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
