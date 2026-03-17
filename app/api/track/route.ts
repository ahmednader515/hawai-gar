import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: "في انتظار موافقة الإدارة",
  PENDING_DRIVER: "في انتظار رد شركة النقل",
  ACCEPTED: "مقبول",
  REFUSED: "مرفوض",
  IN_PROGRESS: "قيد التنفيذ",
  DONE: "منتهي",
  CANCELLED: "ملغى",
};

/**
 * Public API: track order by booking number (رقم الحجز).
 * GET /api/track?bookingNumber=HAW-XXXXXXXX
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bookingNumber = searchParams.get("bookingNumber")?.trim().toUpperCase();

  if (!bookingNumber) {
    return NextResponse.json(
      { error: "رقم الحجز مطلوب" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { bookingNumber },
    include: {
      fromLocation: { select: { nameAr: true } },
      toLocation: { select: { nameAr: true } },
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "لا يوجد طلب بهذا رقم الحجز", found: false },
      { status: 404 }
    );
  }

  return NextResponse.json({
    found: true,
    bookingNumber: order.bookingNumber,
    from: order.fromLocation.nameAr,
    to: order.toLocation.nameAr,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status] ?? order.status,
    createdAt: order.createdAt,
  });
}
