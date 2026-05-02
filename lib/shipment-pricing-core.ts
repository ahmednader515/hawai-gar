export type ShipmentPricingModifierValue = {
  /** Fixed addition in SAR */
  addSar: number;
  /** Percent increase applied to the computed base price */
  pct: number;
};

export type ShipmentPricingModifiers = {
  shipmentType: Record<string, ShipmentPricingModifierValue>;
  truckSize: Record<string, ShipmentPricingModifierValue>;
  truckType: Record<string, ShipmentPricingModifierValue>;
};

export type ShipmentPricingSettingsCore = {
  sarPerKm: number;
  /** Number of kilometers covered by `sarPerKm`. Default: 1 */
  kmPerPriceUnit: number;
  /** Company profit margin percentage added on top of the request price. */
  companyProfitMarginPct: number;
  detailsNote: string | null;
  modifiers: ShipmentPricingModifiers;
};

export function computeShipmentEstimateSar(
  distanceKm: number,
  settings: Pick<
    ShipmentPricingSettingsCore,
    "sarPerKm" | "kmPerPriceUnit" | "companyProfitMarginPct" | "modifiers"
  >,
  ctx?: { shipmentType?: string | null; truckSize?: string | null; truckType?: string | null }
): number {
  const kmUnit =
    Number.isFinite(settings.kmPerPriceUnit) && settings.kmPerPriceUnit > 0 ? settings.kmPerPriceUnit : 1;
  const base = (distanceKm / kmUnit) * settings.sarPerKm;
  const shipmentTypeKey = ctx?.shipmentType?.trim?.() ? String(ctx.shipmentType).trim() : "";
  const truckSizeKey = ctx?.truckSize?.trim?.() ? String(ctx.truckSize).trim() : "";
  const truckTypeKey = ctx?.truckType?.trim?.() ? String(ctx.truckType).trim() : "";

  const st = shipmentTypeKey ? settings.modifiers.shipmentType[shipmentTypeKey] : undefined;
  const ts = truckSizeKey ? settings.modifiers.truckSize[truckSizeKey] : undefined;
  const tt = truckTypeKey ? settings.modifiers.truckType[truckTypeKey] : undefined;

  const addSar = [st?.addSar, ts?.addSar, tt?.addSar].reduce<number>(
    (sum, n) => sum + (Number.isFinite(n as number) ? (n as number) : 0),
    0,
  );
  const pct = [st?.pct, ts?.pct, tt?.pct].reduce<number>(
    (sum, n) => sum + (Number.isFinite(n as number) ? (n as number) : 0),
    0,
  );

  const pctFactor = 1 + pct / 100;
  const requestPrice = base * pctFactor + addSar;
  const profitPct =
    Number.isFinite(settings.companyProfitMarginPct) && settings.companyProfitMarginPct > 0
      ? settings.companyProfitMarginPct
      : 0;
  const profitFactor = 1 + profitPct / 100;
  return requestPrice * profitFactor;
}

