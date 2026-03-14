import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      fromLocation: true,
      toLocation: true,
      company: {
        select: {
          id: true,
          email: true,
          companyProfile: true,
        },
      },
      driver: {
        select: {
          id: true,
          email: true,
          name: true,
          driverProfile: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  const role = session.user.role;
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";

  if (role === "COMPANY" && order.companyId !== session.user.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  if (role === "DRIVER" && order.driverId !== session.user.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  if (!isAdmin) {
    return NextResponse.json({
      id: order.id,
      from: order.fromLocation.nameAr,
      to: order.toLocation.nameAr,
      status: order.status,
      createdAt: order.createdAt,
      companyName:
        order.company?.companyProfile?.companyName ?? undefined,
      driverName:
        order.driver?.driverProfile?.fullName ?? order.driver?.name ?? undefined,
      carPlate: order.driver?.driverProfile?.carPlate ?? undefined,
    });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  const existing = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  if (!existing) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  const allowedFromPendingApproval: OrderStatus[] = ["ACCEPTED", "REFUSED"];
  const allowedFromAcceptedOrLater: OrderStatus[] = ["ACCEPTED", "IN_PROGRESS", "DONE", "CANCELLED"];
  const allowed =
    existing.status === "PENDING_APPROVAL"
      ? allowedFromPendingApproval
      : allowedFromAcceptedOrLater;

  if (!status || !allowed.includes(status)) {
    return NextResponse.json({ error: "حالة غير صالحة أو غير مسموح بها لهذا الطلب" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(order);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
