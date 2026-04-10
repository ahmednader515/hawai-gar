import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getShipmentPricingSettings, setShipmentPricingSettings } from "@/lib/shipment-pricing";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const s = await getShipmentPricingSettings();
    return NextResponse.json(s);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load pricing" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const sarRaw = body?.sarPerKm;
    const multRaw = body?.multiplier;
    const detailsRaw = body?.detailsNote;

    const payload: Parameters<typeof setShipmentPricingSettings>[0] = {};

    if (sarRaw !== undefined) {
      const n = typeof sarRaw === "number" ? sarRaw : Number(sarRaw);
      payload.sarPerKm = n;
    }
    if (multRaw !== undefined) {
      const n = typeof multRaw === "number" ? multRaw : Number(multRaw);
      payload.multiplier = n;
    }
    if (detailsRaw !== undefined) {
      payload.detailsNote =
        detailsRaw === null || detailsRaw === ""
          ? null
          : typeof detailsRaw === "string"
            ? detailsRaw
            : String(detailsRaw);
    }

    const s = await setShipmentPricingSettings(payload);
    return NextResponse.json(s);
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error && e.message.startsWith("invalid_") ? "Invalid values" : "Failed to save pricing";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
