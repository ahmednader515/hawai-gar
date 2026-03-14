import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const accept = body.accept === true;

  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }
  if (order.driverId !== session.user.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  if (order.status !== OrderStatus.PENDING_DRIVER) {
    return NextResponse.json({ error: "تم الرد على هذا الطلب مسبقاً" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id },
    data: {
      status: accept ? OrderStatus.ACCEPTED : OrderStatus.REFUSED,
    },
  });

  return NextResponse.json({
    ok: true,
    status: accept ? OrderStatus.ACCEPTED : OrderStatus.REFUSED,
  });
}
