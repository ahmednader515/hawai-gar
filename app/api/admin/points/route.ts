import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPointsSettings, setPointsSettings } from "@/lib/points-settings";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const settings = await getPointsSettings();
    return NextResponse.json(settings);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load points settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const carrierRaw = body?.carrierPoints;
    const companyRaw = body?.companyPoints;

    const payload: Parameters<typeof setPointsSettings>[0] = {};

    if (carrierRaw !== undefined) {
      const n = typeof carrierRaw === "number" ? carrierRaw : Number(carrierRaw);
      payload.carrierPoints = n;
    }
    if (companyRaw !== undefined) {
      const n = typeof companyRaw === "number" ? companyRaw : Number(companyRaw);
      payload.companyPoints = n;
    }

    if (payload.carrierPoints === undefined && payload.companyPoints === undefined) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const settings = await setPointsSettings(payload);
    return NextResponse.json(settings);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "invalid_carrier_points" || msg === "invalid_company_points") {
      return NextResponse.json({ error: "Invalid points value" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to save points settings" }, { status: 500 });
  }
}
