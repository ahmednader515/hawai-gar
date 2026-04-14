import { NextResponse } from "next/server";
import { DEFAULT_MULTIPLIER, DEFAULT_SAR_PER_KM } from "@/lib/shipment-pricing-constants";
import { getShipmentPricingSettings } from "@/lib/shipment-pricing";

/** Public read for homepage estimate (no secrets). */
export async function GET() {
  try {
    const s = await getShipmentPricingSettings();
    return NextResponse.json({
      sarPerKm: s.sarPerKm,
      multiplier: s.multiplier,
      distanceMultiplier: s.distanceMultiplier,
      detailsNote: s.detailsNote,
      modifiers: s.modifiers,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { sarPerKm: DEFAULT_SAR_PER_KM, multiplier: DEFAULT_MULTIPLIER, distanceMultiplier: 1, detailsNote: null, modifiers: { shipmentType: {}, truckSize: {}, truckType: {} } },
      { status: 200 }
    );
  }
}
