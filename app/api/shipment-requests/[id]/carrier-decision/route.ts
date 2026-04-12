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

    const driverInvites = await prisma.shipmentRequestInvitee.findMany({
      where: { shipmentRequestId: id, kind: "DRIVER" },
      select: { targetId: true },
    });
    if (driverInvites.length > 0) {
      const allowed = driverInvites.some((r) => r.targetId === session.user.id);
      if (!allowed) {
        return NextResponse.json({ error: "غير مصرح لك بالرد على هذا الطلب" }, { status: 403 });
      }
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
      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.shipmentRequest.update({
          where: { id },
          data: {
            status: "CARRIER_ACCEPTED",
            carrierId: session.user.id,
            carrierDecisionAt: new Date(),
            carrierSelfSubmittedDecision: true,
          },
          select: safeRequestSelect,
        });
        await tx.shipmentRequestInvitee.deleteMany({ where: { shipmentRequestId: id } });
        return u;
      });
      return NextResponse.json({ ok: true, request: updated });
    }

    // refuse
    if (existing.status !== "PENDING_CARRIER") {
      return NextResponse.json({ error: "لا يمكن رفض هذا الطلب" }, { status: 400 });
    }
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.shipmentRequest.update({
        where: { id },
        data: {
          status: "CARRIER_REFUSED",
          carrierId: session.user.id,
          carrierDecisionAt: new Date(),
          carrierSelfSubmittedDecision: true,
        },
        select: safeRequestSelect,
      });
      await tx.shipmentRequestInvitee.deleteMany({ where: { shipmentRequestId: id } });
      return u;
    });
    return NextResponse.json({ ok: true, request: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

