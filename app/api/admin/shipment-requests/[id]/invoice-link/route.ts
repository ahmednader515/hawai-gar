import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Admin sets or clears invoice / payment link (visible to company on track). */
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
    const raw = body?.invoiceLink;
    const invoiceLink =
      raw == null || String(raw).trim() === "" ? null : String(raw).trim();

    if (invoiceLink != null && !isValidHttpUrl(invoiceLink)) {
      return NextResponse.json({ error: "الرابط يجب أن يبدأ بـ https://" }, { status: 400 });
    }

    const existing = await prisma.shipmentRequest.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const allowedStatuses = [
      "CARRIER_ACCEPTED",
      "CARRIER_REFUSED",
      "ADMIN_APPROVED",
      "AWAITING_PAYMENT_APPROVAL",
      "COMPLETE",
    ] as const;
    if (!allowedStatuses.includes(existing.status as (typeof allowedStatuses)[number])) {
      return NextResponse.json(
        { error: "لا يمكن إضافة رابط الفاتورة في هذه الحالة" },
        { status: 400 },
      );
    }

    await prisma.shipmentRequest.update({
      where: { id },
      data: { invoiceLink },
    });

    return NextResponse.json({ ok: true, invoiceLink });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
