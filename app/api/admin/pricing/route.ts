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
    const distMultRaw = body?.distanceMultiplier;
    const detailsRaw = body?.detailsNote;
    const modifiersRaw = body?.modifiers;

    const payload: Parameters<typeof setShipmentPricingSettings>[0] = {};

    if (sarRaw !== undefined) {
      const n = typeof sarRaw === "number" ? sarRaw : Number(sarRaw);
      payload.sarPerKm = n;
    }
    if (multRaw !== undefined) {
      const n = typeof multRaw === "number" ? multRaw : Number(multRaw);
      payload.multiplier = n;
    }
    if (distMultRaw !== undefined) {
      const n = typeof distMultRaw === "number" ? distMultRaw : Number(distMultRaw);
      payload.distanceMultiplier = n;
    }
    if (detailsRaw !== undefined) {
      payload.detailsNote =
        detailsRaw === null || detailsRaw === ""
          ? null
          : typeof detailsRaw === "string"
            ? detailsRaw
            : String(detailsRaw);
    }
    if (modifiersRaw !== undefined) {
      const m = modifiersRaw ?? {};
      const valueMap = (raw: unknown) => {
        const out: Record<string, { addSar: number; pct: number }> = {};
        if (!raw || typeof raw !== "object") return out;
        for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
          if (!v || typeof v !== "object") continue;
          const vv = v as Record<string, unknown>;
          const addSarRaw = vv.addSar;
          const pctRaw = vv.pct;
          const addSar = typeof addSarRaw === "number" ? addSarRaw : Number(addSarRaw);
          const pct = typeof pctRaw === "number" ? pctRaw : Number(pctRaw);
          if (!Number.isFinite(addSar) || addSar < 0) continue;
          const safePct = Number.isFinite(pct) && pct >= 0 ? pct : 0;
          out[String(k)] = { addSar, pct: safePct };
        }
        return out;
      };
      payload.modifiers = {
        shipmentType: valueMap((m as any).shipmentType),
        truckSize: valueMap((m as any).truckSize),
        truckType: valueMap((m as any).truckType),
      };
    }

    const s = await setShipmentPricingSettings(payload);
    return NextResponse.json(s);
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error && e.message.startsWith("invalid_") ? "Invalid values" : "Failed to save pricing";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
