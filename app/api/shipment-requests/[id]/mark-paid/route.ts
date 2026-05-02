import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "COMPANY") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const request = await prisma.shipmentRequest.findUnique({
    where: { id },
    select: {
      companyId: true,
      status: true,
      invoiceImageUrl: true,
    },
  });
  if (!request) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }
  if (request.companyId !== session.user.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  if (request.status !== "ADMIN_APPROVED" && request.status !== "AWAITING_PAYMENT_APPROVAL") {
    return NextResponse.json({ error: "لا يمكن تأكيد الدفع في هذه الحالة" }, { status: 400 });
  }

  const nextStatus = request.invoiceImageUrl ? "AWAITING_PAYMENT_APPROVAL" : "ADMIN_APPROVED";
  const updated = await prisma.shipmentRequest.update({
    where: { id },
    data: {
      companyMarkedPaidAt: new Date(),
      status: nextStatus,
    },
    select: {
      status: true,
      companyMarkedPaidAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    status: updated.status,
    companyMarkedPaidAt: updated.companyMarkedPaidAt,
  });
}

