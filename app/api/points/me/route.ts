import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role;
  if (role !== "DRIVER" && role !== "COMPANY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pointsBalance: true },
    });
    return NextResponse.json({ pointsBalance: user?.pointsBalance ?? 0 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load points" }, { status: 500 });
  }
}
