import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCompatibleShipmentCompanies } from "@/lib/shipment-company-compatibility";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await req.json()) as { shipmentCompanyId?: string };
    const shipmentCompanyId = String(body?.shipmentCompanyId ?? "").trim();
    if (!shipmentCompanyId) {
      return NextResponse.json({ error: "شركة الشحن مطلوبة" }, { status: 400 });
    }

    const existing = await prisma.shipmentRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        shipmentType: true,
        containerSize: true,
        containersCount: true,
        fromText: true,
        toText: true,
        fromLat: true,
        fromLng: true,
        toLat: true,
        toLng: true,
        notes: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    if (existing.status !== "PENDING_CARRIER") {
      return NextResponse.json(
        { error: "لا يمكن تعيين شركة شحن إلا عندما تكون الحالة بانتظار شركة النقل" },
        { status: 400 },
      );
    }

    const selectedCompany = await prisma.shipmentCompany.findUnique({
      where: { id: shipmentCompanyId },
      select: {
        id: true,
        company_name: true,
        representative_name: true,
        phone: true,
        email: true,
        truck_types: true,
        destinations: true,
      },
    });
    if (!selectedCompany) {
      return NextResponse.json({ error: "شركة الشحن غير موجودة" }, { status: 404 });
    }

    // Defensive check: ensure selected company is in current compatibility set.
    const companies = await prisma.shipmentCompany.findMany({
      select: {
        id: true,
        company_name: true,
        representative_name: true,
        phone: true,
        email: true,
        truck_types: true,
        destinations: true,
      },
    });
    const compatibleIds = new Set(
      getCompatibleShipmentCompanies(existing, companies).map((c) => c.company.id),
    );
    if (!compatibleIds.has(shipmentCompanyId)) {
      return NextResponse.json(
        { error: "شركة الشحن المحددة غير متوافقة مع بيانات الطلب" },
        { status: 400 },
      );
    }

    const updated = await prisma.shipmentRequest.update({
      where: { id },
      data: {
        shipmentCompanyId,
        status: "CARRIER_ACCEPTED",
        carrierDecisionAt: new Date(),
        carrierId: null,
      },
      select: {
        id: true,
        status: true,
        shipmentCompanyId: true,
        carrierDecisionAt: true,
      },
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
