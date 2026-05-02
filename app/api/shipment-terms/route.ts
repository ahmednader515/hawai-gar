import { NextResponse } from "next/server";
import { getShipmentTerms } from "@/lib/shipment-terms";

/** Public read for terms popup before sending shipment request. */
export async function GET() {
  try {
    const terms = await getShipmentTerms();
    return NextResponse.json(terms);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load terms" }, { status: 500 });
  }
}

