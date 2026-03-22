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

/** Company saves proof-of-payment image URL after UploadThing upload. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "COMPANY") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const raw = body?.invoiceImageUrl;
    const invoiceImageUrl =
      raw == null || String(raw).trim() === "" ? null : String(raw).trim();

    if (invoiceImageUrl != null && !isValidHttpUrl(invoiceImageUrl)) {
      return NextResponse.json({ error: "رابط الصورة غير صالح" }, { status: 400 });
    }

    const r = await prisma.shipmentRequest.findUnique({
      where: { id },
      select: { companyId: true, status: true },
    });
    if (!r) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    if (r.companyId !== session.user.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    /** Upload/replace proof only after admin approved price; review state allows replace. */
    const canUpload = r.status === "ADMIN_APPROVED" || r.status === "AWAITING_PAYMENT_APPROVAL";

    if (!canUpload) {
      return NextResponse.json(
        { error: "يمكن رفع إيصال الدفع بعد الموافقة على السعر فقط" },
        { status: 400 },
      );
    }

    // After final price approval, uploading proof moves request to "awaiting payment review".
    // Clearing the image from that state returns to price-approved (no proof).
    let nextStatus = r.status;
    if (invoiceImageUrl) {
      if (r.status === "ADMIN_APPROVED" || r.status === "AWAITING_PAYMENT_APPROVAL") {
        nextStatus = "AWAITING_PAYMENT_APPROVAL";
      }
    } else if (r.status === "AWAITING_PAYMENT_APPROVAL") {
      nextStatus = "ADMIN_APPROVED";
    }

    await prisma.shipmentRequest.update({
      where: { id },
      data: { invoiceImageUrl, status: nextStatus },
    });

    return NextResponse.json({ ok: true, invoiceImageUrl, status: nextStatus });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
