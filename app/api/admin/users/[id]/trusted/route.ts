import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const trusted = Boolean(body && typeof body === "object" && (body as { trusted?: unknown }).trusted === true);

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, blacklistedAt: true },
  });

  if (!target) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (target.role !== UserRole.DRIVER) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (target.blacklistedAt) {
    return NextResponse.json({ error: "BLACKLISTED_DRIVER" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { trustedAt: trusted ? new Date() : null },
  });

  return NextResponse.json({ ok: true });
}
