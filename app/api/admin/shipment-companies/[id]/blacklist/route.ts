import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const blacklisted = Boolean(body && typeof body === "object" && (body as { blacklisted?: unknown }).blacklisted === true);

  const existing = await prisma.shipmentCompany.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.shipmentCompany.update({
    where: { id },
    data: { blacklistedAt: blacklisted ? new Date() : null },
  });

  return NextResponse.json({ ok: true });
}
