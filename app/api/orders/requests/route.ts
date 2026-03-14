import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    where: {
      driverId: session.user.id,
      status: "PENDING_APPROVAL",
    },
    include: {
      fromLocation: { select: { nameAr: true } },
      toLocation: { select: { nameAr: true } },
      company: {
        select: {
          companyProfile: { select: { companyName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  type OrderWithRelations = { id: string; createdAt: Date; fromLocation: { nameAr: string }; toLocation: { nameAr: string }; company?: { companyProfile?: { companyName: string } | null } | null };
  return NextResponse.json(
    (orders as unknown as OrderWithRelations[]).map((o) => ({
      id: o.id,
      from: o.fromLocation.nameAr,
      to: o.toLocation.nameAr,
      companyName: o.company?.companyProfile?.companyName ?? "—",
      createdAt: o.createdAt,
    }))
  );
}
