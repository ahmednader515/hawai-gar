import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const items = await prisma.newsItem.findMany({
      orderBy: { publishedAt: "desc" },
      take: 10,
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
