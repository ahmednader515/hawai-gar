import { prisma } from "@/lib/db";
import { DEFAULT_MULTIPLIER, DEFAULT_SAR_PER_KM } from "@/lib/shipment-pricing-constants";
import { type ShipmentPricingSettingsCore } from "@/lib/shipment-pricing-core";

export { DEFAULT_MULTIPLIER, DEFAULT_SAR_PER_KM } from "@/lib/shipment-pricing-constants";
export { computeShipmentEstimateSar } from "@/lib/shipment-pricing-core";

const KEY_SAR_PER_KM = "shipment_price_sar_per_km";
const KEY_MULTIPLIER = "shipment_price_multiplier";
const KEY_DISTANCE_MULTIPLIER = "shipment_distance_multiplier";
const KEY_DETAILS = "shipment_pricing_details";
const KEY_MODIFIERS = "shipment_pricing_modifiers_v1";

export type ShipmentPricingSettings = ShipmentPricingSettingsCore;

function parsePositiveNum(raw: string | undefined, fallback: number): number {
  const n = parseFloat(String(raw ?? "").trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function safeParseModifiers(raw: string | undefined | null): ShipmentPricingSettings["modifiers"] {
  const empty = { shipmentType: {}, truckSize: {}, truckType: {} } as const;
  const s = raw?.trim?.() ? String(raw).trim() : "";
  if (!s) return { ...empty };
  try {
    const parsed = JSON.parse(s) as unknown;
    if (!parsed || typeof parsed !== "object") return { ...empty };
    const obj = parsed as Record<string, unknown>;
    const pickMap = (k: string) => {
      const v = obj[k];
      if (!v || typeof v !== "object") return {};
      const out: Record<string, { addSar: number; pct: number }> = {};
      for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
        // Back-compat: old format was number => addSar
        if (typeof val === "number") {
          const n = val;
          if (Number.isFinite(n) && n >= 0) out[String(key)] = { addSar: n, pct: 0 };
          continue;
        }
        if (!val || typeof val !== "object") continue;
        const vv = val as Record<string, unknown>;
        const addSarRaw = vv.addSar;
        const pctRaw = vv.pct;
        const addSar = typeof addSarRaw === "number" ? addSarRaw : Number(addSarRaw);
        const pct = typeof pctRaw === "number" ? pctRaw : Number(pctRaw);
        if (!Number.isFinite(addSar) || addSar < 0) continue;
        const safePct = Number.isFinite(pct) && pct >= 0 ? pct : 0;
        out[String(key)] = { addSar, pct: safePct };
      }
      return out;
    };
    return {
      shipmentType: pickMap("shipmentType"),
      truckSize: pickMap("truckSize"),
      truckType: pickMap("truckType"),
    };
  } catch {
    return { ...empty };
  }
}

export async function getShipmentPricingSettings(): Promise<ShipmentPricingSettings> {
  try {
    const [sarRow, multRow, distMultRow, detailsRow, modifiersRow] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: KEY_SAR_PER_KM } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_MULTIPLIER } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_DISTANCE_MULTIPLIER } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_DETAILS } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_MODIFIERS } }),
    ]);
    return {
      sarPerKm: parsePositiveNum(sarRow?.value, DEFAULT_SAR_PER_KM),
      multiplier: parsePositiveNum(multRow?.value, DEFAULT_MULTIPLIER),
      distanceMultiplier: parsePositiveNum(distMultRow?.value, 1),
      detailsNote: detailsRow?.value?.trim() ? detailsRow.value.trim() : null,
      modifiers: safeParseModifiers(modifiersRow?.value),
    };
  } catch {
    return {
      sarPerKm: DEFAULT_SAR_PER_KM,
      multiplier: DEFAULT_MULTIPLIER,
      distanceMultiplier: 1,
      detailsNote: null,
      modifiers: { shipmentType: {}, truckSize: {}, truckType: {} },
    };
  }
}

export async function setShipmentPricingSettings(data: {
  sarPerKm?: number;
  multiplier?: number;
  distanceMultiplier?: number;
  detailsNote?: string | null;
  modifiers?: ShipmentPricingSettings["modifiers"];
}): Promise<ShipmentPricingSettings> {
  if (data.sarPerKm !== undefined) {
    if (!Number.isFinite(data.sarPerKm) || data.sarPerKm <= 0) {
      throw new Error("invalid_sar_per_km");
    }
    await prisma.siteSetting.upsert({
      where: { key: KEY_SAR_PER_KM },
      create: { key: KEY_SAR_PER_KM, value: String(data.sarPerKm) },
      update: { value: String(data.sarPerKm) },
    });
  }
  if (data.multiplier !== undefined) {
    if (!Number.isFinite(data.multiplier) || data.multiplier <= 0) {
      throw new Error("invalid_multiplier");
    }
    await prisma.siteSetting.upsert({
      where: { key: KEY_MULTIPLIER },
      create: { key: KEY_MULTIPLIER, value: String(data.multiplier) },
      update: { value: String(data.multiplier) },
    });
  }
  if (data.distanceMultiplier !== undefined) {
    if (!Number.isFinite(data.distanceMultiplier) || data.distanceMultiplier <= 0) {
      throw new Error("invalid_distance_multiplier");
    }
    await prisma.siteSetting.upsert({
      where: { key: KEY_DISTANCE_MULTIPLIER },
      create: { key: KEY_DISTANCE_MULTIPLIER, value: String(data.distanceMultiplier) },
      update: { value: String(data.distanceMultiplier) },
    });
  }
  if (data.detailsNote !== undefined) {
    const v = data.detailsNote?.trim() ?? "";
    await prisma.siteSetting.upsert({
      where: { key: KEY_DETAILS },
      create: { key: KEY_DETAILS, value: v },
      update: { value: v },
    });
  }
  if (data.modifiers !== undefined) {
    const v = JSON.stringify({
      shipmentType: data.modifiers.shipmentType ?? {},
      truckSize: data.modifiers.truckSize ?? {},
      truckType: data.modifiers.truckType ?? {},
    });
    await prisma.siteSetting.upsert({
      where: { key: KEY_MODIFIERS },
      create: { key: KEY_MODIFIERS, value: v },
      update: { value: v },
    });
  }
  return getShipmentPricingSettings();
}
