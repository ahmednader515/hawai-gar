import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.titleAr != null) data.titleAr = body.titleAr;
    if (body.titleEn != null) data.titleEn = body.titleEn;
    if (body.category != null) data.category = body.category;
    if (body.categoryEn !== undefined) data.categoryEn = body.categoryEn;
    if (body.imageUrl != null) data.imageUrl = body.imageUrl;
    if (body.excerpt !== undefined) data.excerpt = body.excerpt;
    if (body.excerptEn !== undefined) data.excerptEn = body.excerptEn;
    if (body.link != null) data.link = body.link;
    if (body.publishedAt != null) data.publishedAt = new Date(body.publishedAt);
    const item = await prisma.newsItem.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await prisma.newsItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
