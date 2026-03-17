import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const decision = String(body?.decision ?? "");
    if (decision !== "approve" && decision !== "reject") {
      return NextResponse.json({ error: "قرار غير صالح" }, { status: 400 });
    }

    const existing = await prisma.shipmentRequest.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (existing.status === "PENDING_CARRIER") {
      return NextResponse.json(
        { error: "يجب أن تقبل/ترفض شركة النقل أولاً" },
        { status: 400 }
      );
    }

    if (decision === "approve" && existing.status !== "CARRIER_ACCEPTED") {
      return NextResponse.json(
        { error: "لا يمكن للأدمن الموافقة قبل قبول شركة النقل" },
        { status: 400 }
      );
    }

    // Admin decision comes after carrier decision.
    const nextStatus = decision === "approve" ? "ADMIN_APPROVED" : "ADMIN_REJECTED";

    const updated = await prisma.shipmentRequest.update({
      where: { id },
      data: {
        status: nextStatus,
        adminId: session.user.id,
        adminDecisionAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

