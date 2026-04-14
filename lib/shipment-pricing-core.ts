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
  multiplier: number;
  /** Multiplies the computed distance before pricing. Default: 1 */
  distanceMultiplier: number;
  detailsNote: string | null;
  modifiers: ShipmentPricingModifiers;
};

export function computeShipmentEstimateSar(
  distanceKm: number,
  settings: Pick<ShipmentPricingSettingsCore, "sarPerKm" | "multiplier" | "distanceMultiplier" | "modifiers">,
  ctx?: { shipmentType?: string | null; truckSize?: string | null; truckType?: string | null }
): number {
  const effectiveDistanceKm =
    Number.isFinite(settings.distanceMultiplier) && settings.distanceMultiplier > 0
      ? distanceKm * settings.distanceMultiplier
      : distanceKm;
  const base = effectiveDistanceKm * settings.sarPerKm * settings.multiplier;
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
  return base * pctFactor + addSar;
}

