import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const locations = await prisma.location.findMany({
    orderBy: { nameAr: "asc" },
    select: { id: true, nameAr: true, slug: true },
  });
  return NextResponse.json(locations);
}
