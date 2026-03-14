import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "COMPANY") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fromId = searchParams.get("from");
  const toId = searchParams.get("to");
  if (!fromId || !toId) {
    return NextResponse.json(
      { error: "يجب تحديد نقطة الانطلاق والوصول" },
      { status: 400 }
    );
  }

  const drivers = await prisma.user.findMany({
    where: {
      role: "DRIVER",
      driverProfile: { isNot: null },
    },
    select: {
      id: true,
      name: true,
      driverProfile: {
        select: {
          carPlate: true,
          carType: true,
          fullName: true,
        },
      },
    },
  });

  type WithProfile = { id: string; name: string | null; driverProfile?: { fullName: string | null; carPlate: string | null; carType: string | null } | null };
  return NextResponse.json(
    (drivers as WithProfile[]).map((d) => ({
      id: d.id,
      name: d.driverProfile?.fullName ?? d.name,
      carPlate: d.driverProfile?.carPlate,
      carType: d.driverProfile?.carType,
    }))
  );
}
