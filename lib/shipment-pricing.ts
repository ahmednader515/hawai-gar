import { prisma } from "@/lib/db";
import { DEFAULT_MULTIPLIER, DEFAULT_SAR_PER_KM } from "@/lib/shipment-pricing-constants";

export { DEFAULT_MULTIPLIER, DEFAULT_SAR_PER_KM } from "@/lib/shipment-pricing-constants";

const KEY_SAR_PER_KM = "shipment_price_sar_per_km";
const KEY_MULTIPLIER = "shipment_price_multiplier";
const KEY_DETAILS = "shipment_pricing_details";

export type ShipmentPricingSettings = {
  sarPerKm: number;
  multiplier: number;
  /** Optional note shown with the estimate on the homepage (e.g. what the multiplier includes). */
  detailsNote: string | null;
};

export function computeShipmentEstimateSar(
  distanceKm: number,
  settings: Pick<ShipmentPricingSettings, "sarPerKm" | "multiplier">
): number {
  return distanceKm * settings.sarPerKm * settings.multiplier;
}

function parsePositiveNum(raw: string | undefined, fallback: number): number {
  const n = parseFloat(String(raw ?? "").trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function getShipmentPricingSettings(): Promise<ShipmentPricingSettings> {
  try {
    const [sarRow, multRow, detailsRow] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: KEY_SAR_PER_KM } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_MULTIPLIER } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_DETAILS } }),
    ]);
    return {
      sarPerKm: parsePositiveNum(sarRow?.value, DEFAULT_SAR_PER_KM),
      multiplier: parsePositiveNum(multRow?.value, DEFAULT_MULTIPLIER),
      detailsNote: detailsRow?.value?.trim() ? detailsRow.value.trim() : null,
    };
  } catch {
    return {
      sarPerKm: DEFAULT_SAR_PER_KM,
      multiplier: DEFAULT_MULTIPLIER,
      detailsNote: null,
    };
  }
}

export async function setShipmentPricingSettings(data: {
  sarPerKm?: number;
  multiplier?: number;
  detailsNote?: string | null;
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
  if (data.detailsNote !== undefined) {
    const v = data.detailsNote?.trim() ?? "";
    await prisma.siteSetting.upsert({
      where: { key: KEY_DETAILS },
      create: { key: KEY_DETAILS, value: v },
      update: { value: v },
    });
  }
  return getShipmentPricingSettings();
}
