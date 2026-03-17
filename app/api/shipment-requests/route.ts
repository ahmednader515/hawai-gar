import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      from,
      to,
      containerSize,
      containersCount,
      pickupDate,
      notes,
      phone,
    } = body ?? {};

    if (!from || !to) {
      return NextResponse.json(
        { error: "حقلا «من» و«إلى» مطلوبان" },
        { status: 400 }
      );
    }

    const created = await prisma.shipmentRequest.create({
      data: {
        fromText: String(from).trim(),
        toText: String(to).trim(),
        containerSize: containerSize ? String(containerSize) : null,
        containersCount: containersCount ? String(containersCount) : null,
        pickupDate: pickupDate ? String(pickupDate) : null,
        notes: notes ? String(notes) : null,
        phone: phone ? String(phone) : null,
        status: "PENDING_CARRIER",
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "تعذر إنشاء طلب الشحن" },
      { status: 500 }
    );
  }
}

