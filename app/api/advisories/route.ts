import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const items = await prisma.customerAdvisory.findMany({
      orderBy: { publishedAt: "desc" },
      take: 20,
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch advisories" }, { status: 500 });
  }
}
