import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getShipmentTerms, setShipmentTerms } from "@/lib/shipment-terms";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const terms = await getShipmentTerms();
    return NextResponse.json(terms);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load terms" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    await setShipmentTerms({
      titleAr: typeof body?.titleAr === "string" ? body.titleAr : undefined,
      titleEn: typeof body?.titleEn === "string" ? body.titleEn : undefined,
      contentAr: typeof body?.contentAr === "string" ? body.contentAr : undefined,
      contentEn: typeof body?.contentEn === "string" ? body.contentEn : undefined,
    });
    const terms = await getShipmentTerms();
    return NextResponse.json(terms);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save terms" }, { status: 500 });
  }
}

