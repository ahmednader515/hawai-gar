import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Public API: check if there is transport between two stations on a given date.
 * Query params: from (location id), to (location id), date (YYYY-MM-DD).
 * Uses orders created on that date (Order has no scheduledDate; we filter by createdAt).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromId = searchParams.get("from");
  const toId = searchParams.get("to");
  const dateStr = searchParams.get("date");

  if (!fromId || !toId || !dateStr) {
    return NextResponse.json(
      { error: "المحطة الأولى والمحطة الثانية والتاريخ مطلوبون" },
      { status: 400 }
    );
  }

  const date = new Date(dateStr + "T00:00:00.000Z");
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "تاريخ غير صالح" }, { status: 400 });
  }
  const nextDay = new Date(date);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const count = await prisma.order.count({
    where: {
      fromLocationId: fromId,
      toLocationId: toId,
      createdAt: {
        gte: date,
        lt: nextDay,
      },
    },
  });

  return NextResponse.json({
    available: count > 0,
    count,
    date: dateStr,
  });
}
