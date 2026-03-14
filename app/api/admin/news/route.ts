import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { titleAr, titleEn, category, imageUrl, excerpt, link, publishedAt } = body;
    if (!titleAr || !category || !imageUrl || !publishedAt) {
      return NextResponse.json(
        { error: "titleAr, category, imageUrl, publishedAt required" },
        { status: 400 }
      );
    }
    const item = await prisma.newsItem.create({
      data: {
        titleAr,
        titleEn: titleEn ?? null,
        category,
        imageUrl,
        excerpt: excerpt ?? null,
        link: link ?? null,
        publishedAt: new Date(publishedAt),
      },
    });
    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create news item" }, { status: 500 });
  }
}
