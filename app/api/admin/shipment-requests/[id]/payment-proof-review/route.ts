import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/** Admin approves or rejects company-uploaded payment proof image. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const decision = body?.decision;
    if (decision !== "approve" && decision !== "reject") {
      return NextResponse.json({ error: "قرار غير صالح" }, { status: 400 });
    }

    const existing = await prisma.shipmentRequest.findUnique({
      where: { id },
      select: { id: true, status: true, invoiceImageUrl: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    if (existing.status !== "AWAITING_PAYMENT_APPROVAL") {
      return NextResponse.json(
        { error: "لا يوجد إيصال بانتظار المراجعة" },
        { status: 400 },
      );
    }
    if (!existing.invoiceImageUrl) {
      return NextResponse.json({ error: "لا توجد صورة مرفوعة" }, { status: 400 });
    }

    if (decision === "approve") {
      await prisma.shipmentRequest.update({
        where: { id },
        data: { status: "COMPLETE" },
      });
    } else {
      await prisma.shipmentRequest.update({
        where: { id },
        data: {
          status: "ADMIN_APPROVED",
          invoiceImageUrl: null,
        },
      });
    }

    return NextResponse.json({ ok: true, status: decision === "approve" ? "COMPLETE" : "ADMIN_APPROVED" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
