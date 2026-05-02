import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const KEY_ANALYTICS_BASELINE = "analytics_baseline_ts";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  await prisma.siteSetting.upsert({
    where: { key: KEY_ANALYTICS_BASELINE },
    create: { key: KEY_ANALYTICS_BASELINE, value: now.toISOString() },
    update: { value: now.toISOString() },
  });

  return NextResponse.json({ ok: true, baseline: now.toISOString() });
}

