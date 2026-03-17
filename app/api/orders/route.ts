import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

function generateBookingNumber(): string {
  return "HAW-" + randomBytes(4).toString("hex").toUpperCase();
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const role = session.user.role;
  const userId = session.user.id;

  type OrderWithLocations = { id: string; bookingNumber: string; status: OrderStatus; createdAt: Date; fromLocation: { nameAr: string }; toLocation: { nameAr: string }; driver?: { id: string; name: string | null; driverProfile?: { carPlate: string | null; fullName: string } | null } | null };
  type OrderWithCompany = { id: string; bookingNumber: string; status: OrderStatus; createdAt: Date; fromLocation: { nameAr: string }; toLocation: { nameAr: string }; company?: { companyProfile?: { companyName: string } | null } | null };

  if (role === "COMPANY") {
    const orders = await prisma.order.findMany({
      where: { companyId: userId },
      include: {
        fromLocation: { select: { nameAr: true } },
        toLocation: { select: { nameAr: true } },
        driver: {
          select: {
            id: true,
            name: true,
            driverProfile: { select: { carPlate: true, fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      (orders as unknown as OrderWithLocations[]).map((o) => ({
        id: o.id,
        bookingNumber: o.bookingNumber,
        from: o.fromLocation.nameAr,
        to: o.toLocation.nameAr,
        status: o.status,
        createdAt: o.createdAt,
        driver: o.driver
          ? {
              name: o.driver.driverProfile?.fullName ?? o.driver.name,
              carPlate: o.driver.driverProfile?.carPlate,
            }
          : null,
      }))
    );
  }

  if (role === "DRIVER") {
    const orders = await prisma.order.findMany({
      where: { driverId: userId },
      include: {
        fromLocation: { select: { nameAr: true } },
        toLocation: { select: { nameAr: true } },
        company: {
          select: {
            id: true,
            companyProfile: { select: { companyName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      (orders as unknown as OrderWithCompany[]).map((o) => ({
        id: o.id,
        bookingNumber: o.bookingNumber,
        from: o.fromLocation.nameAr,
        to: o.toLocation.nameAr,
        status: o.status,
        createdAt: o.createdAt,
        companyName: o.company?.companyProfile?.companyName ?? "—",
      }))
    );
  }

  if (role === "ADMIN" || role === "SUPERVISOR") {
    const orders = await prisma.order.findMany({
      include: {
        fromLocation: { select: { nameAr: true } },
        toLocation: { select: { nameAr: true } },
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
            driverProfile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }

  return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "COMPANY") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const body = await req.json();
  const { fromLocationId, toLocationId, driverId } = body;
  if (!fromLocationId || !toLocationId || !driverId) {
    return NextResponse.json(
      { error: "نقطة الانطلاق والوصول وشركة النقل مطلوبة" },
      { status: 400 }
    );
  }

  let bookingNumber = generateBookingNumber();
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.order.findUnique({ where: { bookingNumber } });
    if (!existing) break;
    bookingNumber = generateBookingNumber();
  }

  const order = await prisma.order.create({
    data: {
      bookingNumber,
      companyId: session.user.id,
      driverId: String(driverId),
      fromLocationId: String(fromLocationId),
      toLocationId: String(toLocationId),
      status: OrderStatus.PENDING_APPROVAL,
    },
  });
  return NextResponse.json({ ...order, bookingNumber: order.bookingNumber });
}
