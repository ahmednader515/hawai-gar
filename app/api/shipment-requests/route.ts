import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== "COMPANY") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await req.json();
    const {
      from,
      to,
      fromLat,
      fromLng,
      toLat,
      toLng,
      shipmentType,
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
    if (!shipmentType) {
      return NextResponse.json({ error: "نوع الشحنة مطلوب" }, { status: 400 });
    }
    if (!containerSize) {
      return NextResponse.json({ error: "حجم الشاحنة مطلوب" }, { status: 400 });
    }
    if (!containersCount) {
      return NextResponse.json({ error: "نوع الشاحنة مطلوب" }, { status: 400 });
    }
    if (!pickupDate) {
      return NextResponse.json({ error: "تاريخ الاستلام مطلوب" }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "رقم التواصل مطلوب" }, { status: 400 });
    }

    const fl = Number(fromLat);
    const fg = Number(fromLng);
    const tl = Number(toLat);
    const tg = Number(toLng);
    const hasCoords =
      Number.isFinite(fl) && Number.isFinite(fg) && Number.isFinite(tl) && Number.isFinite(tg);
    const distanceKm = hasCoords ? haversineKm({ lat: fl, lng: fg }, { lat: tl, lng: tg }) : null;
    const priceSar = distanceKm != null ? distanceKm * 500 * 1.15 : null;

    const created = await prisma.shipmentRequest.create({
      data: {
        fromText: String(from).trim(),
        toText: String(to).trim(),
        companyId: session.user.id,
        shipmentType: String(shipmentType).trim(),
        fromLat: hasCoords ? fl : null,
        fromLng: hasCoords ? fg : null,
        toLat: hasCoords ? tl : null,
        toLng: hasCoords ? tg : null,
        distanceKm,
        priceSar,
        estimatedPriceSar: priceSar,
        adminPriceChanged: false,
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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== "COMPANY") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const requests = await prisma.shipmentRequest.findMany({
      where: { companyId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fromText: true,
        toText: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, items: requests });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر جلب طلبات الشحن" }, { status: 500 });
  }
}

