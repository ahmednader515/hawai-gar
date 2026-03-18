import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const STATUS_LABELS: Record<string, string> = {
  PENDING_CARRIER: "بانتظار قرار شركة النقل",
  CARRIER_ACCEPTED: "بانتظار قرار الأدمن بقبول أو رفض الطلب",
  CARRIER_REFUSED: "بانتظار قرار الأدمن بقبول أو رفض الطلب",
  ADMIN_APPROVED: "تمت الموافقة النهائية",
  ADMIN_REJECTED: "تم الرفض النهائي",
};

/**
 * Track ShipmentRequest by its id (for companies only).
 * GET /api/shipment-requests/track?id=...
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== "COMPANY") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "رقم الطلب مطلوب" }, { status: 400 });
  }

  try {
    const r = await prisma.shipmentRequest.findUnique({
      where: { id },
      select: {
        id: true,
        companyId: true,
        fromText: true,
        toText: true,
        shipmentType: true,
        fromLat: true,
        fromLng: true,
        toLat: true,
        toLng: true,
        distanceKm: true,
        priceSar: true,
        containerSize: true,
        containersCount: true,
        pickupDate: true,
        notes: true,
        status: true,
        createdAt: true,
        carrierDecisionAt: true,
        adminDecisionAt: true,
      },
    });

    if (!r) {
      return NextResponse.json({ found: false, error: "لا يوجد طلب بهذا الرقم" }, { status: 404 });
    }
    if (r.companyId && r.companyId !== session.user.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    return NextResponse.json({
      found: true,
      id: r.id,
      from: r.fromText,
      to: r.toText,
      shipmentType: r.shipmentType,
      fromLat: r.fromLat,
      fromLng: r.fromLng,
      toLat: r.toLat,
      toLng: r.toLng,
      distanceKm: r.distanceKm,
      priceSar: r.priceSar,
      containerSize: r.containerSize,
      containersCount: r.containersCount,
      pickupDate: r.pickupDate,
      notes: r.notes,
      status: r.status,
      statusLabel: STATUS_LABELS[r.status] ?? r.status,
      createdAt: r.createdAt,
      carrierDecisionAt: r.carrierDecisionAt,
      adminDecisionAt: r.adminDecisionAt,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر جلب حالة الطلب" }, { status: 500 });
  }
}

