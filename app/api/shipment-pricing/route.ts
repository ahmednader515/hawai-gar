import { NextResponse } from "next/server";
import {
  DEFAULT_COMPANY_PROFIT_MARGIN_PCT,
  DEFAULT_KM_PER_PRICE_UNIT,
  DEFAULT_SAR_PER_KM,
} from "@/lib/shipment-pricing-constants";
import { getShipmentPricingSettings } from "@/lib/shipment-pricing";

/** Public read for homepage estimate (no secrets). */
export async function GET() {
  try {
    const s = await getShipmentPricingSettings();
    return NextResponse.json({
      sarPerKm: s.sarPerKm,
      kmPerPriceUnit: s.kmPerPriceUnit,
      companyProfitMarginPct: s.companyProfitMarginPct,
      detailsNote: s.detailsNote,
      modifiers: s.modifiers,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        sarPerKm: DEFAULT_SAR_PER_KM,
        kmPerPriceUnit: DEFAULT_KM_PER_PRICE_UNIT,
        companyProfitMarginPct: DEFAULT_COMPANY_PROFIT_MARGIN_PCT,
        detailsNote: null,
        modifiers: { shipmentType: {}, truckSize: {}, truckType: {} },
      },
      { status: 200 }
    );
  }
}
