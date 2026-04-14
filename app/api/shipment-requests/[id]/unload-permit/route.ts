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

/** Company saves unloading permit image URL after UploadThing upload. */
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
    const raw = body?.unloadPermitImageUrl;
    const unloadPermitImageUrl =
      raw == null || String(raw).trim() === "" ? null : String(raw).trim();

    if (unloadPermitImageUrl != null && !isValidHttpUrl(unloadPermitImageUrl)) {
      return NextResponse.json({ error: "رابط الصورة غير صالح" }, { status: 400 });
    }

    const r = await prisma.shipmentRequest.findUnique({
      where: { id },
      select: { companyId: true, status: true, unloadPermitRequired: true, invoiceImageUrl: true },
    });
    if (!r) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    if (r.companyId !== session.user.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    if (!r.unloadPermitRequired) {
      return NextResponse.json({ error: "هذا الطلب لا يتطلب تصريح تنزيل" }, { status: 400 });
    }
    if (!r.invoiceImageUrl) {
      return NextResponse.json({ error: "ارفع إيصال الدفع أولاً" }, { status: 400 });
    }

    const canUpload = r.status === "AWAITING_PAYMENT_APPROVAL" || r.status === "COMPLETE";
    if (!canUpload) {
      return NextResponse.json({ error: "يمكن رفع تصريح التنزيل بعد رفع إيصال الدفع" }, { status: 400 });
    }

    await prisma.shipmentRequest.update({
      where: { id },
      data: { unloadPermitImageUrl },
    });

    return NextResponse.json({ ok: true, unloadPermitImageUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

