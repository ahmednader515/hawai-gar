import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const decision = String(body?.decision ?? "");
    if (decision !== "accept" && decision !== "refuse") {
      return NextResponse.json({ error: "قرار غير صالح" }, { status: 400 });
    }

    const existing = await prisma.shipmentRequest.findUnique({
      where: { id },
      select: { id: true, status: true, carrierId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const safeRequestSelect = {
      id: true,
      status: true,
      carrierId: true,
      carrierDecisionAt: true,
    } as const;

    if (decision === "accept") {
      if (existing.status !== "PENDING_CARRIER") {
        return NextResponse.json({ error: "لا يمكن قبول هذا الطلب" }, { status: 400 });
      }
      const updated = await prisma.shipmentRequest.update({
        where: { id },
        data: {
          status: "CARRIER_ACCEPTED",
          carrierId: session.user.id,
          carrierDecisionAt: new Date(),
        },
        select: safeRequestSelect,
      });
      return NextResponse.json({ ok: true, request: updated });
    }

    // refuse
    if (existing.status !== "PENDING_CARRIER") {
      return NextResponse.json({ error: "لا يمكن رفض هذا الطلب" }, { status: 400 });
    }
    const updated = await prisma.shipmentRequest.update({
      where: { id },
      data: {
        status: "CARRIER_REFUSED",
        carrierId: session.user.id,
        carrierDecisionAt: new Date(),
      },
      select: safeRequestSelect,
    });
    return NextResponse.json({ ok: true, request: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

