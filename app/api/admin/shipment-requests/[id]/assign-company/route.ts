import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import {
  allowsAdminCarrierReassign,
  shouldClearWorkflowOnCarrierChange,
  workflowFieldsClearedOnCarrierChange,
} from "@/lib/admin-carrier-reassign";
import {
  driverUserToShipmentCompanyLike,
  getCompatibleShipmentCompanies,
} from "@/lib/shipment-company-compatibility";

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
    const body = (await req.json()) as { shipmentCompanyId?: string; carrierUserId?: string };
    const shipmentCompanyId = String(body?.shipmentCompanyId ?? "").trim();
    const carrierUserId = String(body?.carrierUserId ?? "").trim();
    if (!shipmentCompanyId && !carrierUserId) {
      return NextResponse.json({ error: "شركة الشحن أو الناقل مطلوب" }, { status: 400 });
    }
    if (shipmentCompanyId && carrierUserId) {
      return NextResponse.json({ error: "اختر إما شركة من الدليل أو ناقل مسجّل" }, { status: 400 });
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
    if (!allowsAdminCarrierReassign(existing.status)) {
      return NextResponse.json(
        { error: "لا يمكن تغيير الناقل في هذه الحالة" },
        { status: 400 },
      );
    }

    const workflowReset = shouldClearWorkflowOnCarrierChange(existing.status)
      ? workflowFieldsClearedOnCarrierChange()
      : {};

    if (carrierUserId) {
      const driverUser = await prisma.user.findUnique({
        where: { id: carrierUserId },
        include: {
          driverProfile: true,
        },
      });
      if (!driverUser || driverUser.role !== UserRole.DRIVER || !driverUser.driverProfile) {
        return NextResponse.json({ error: "الناقل غير موجود" }, { status: 404 });
      }
      if (driverUser.blacklistedAt) {
        return NextResponse.json({ error: "الناقل محظور ولا يمكن تعيينه" }, { status: 400 });
      }
      const like = driverUserToShipmentCompanyLike({
        id: driverUser.id,
        email: driverUser.email,
        createdAt: driverUser.createdAt,
        driverProfile: driverUser.driverProfile,
      });
      const compat = getCompatibleShipmentCompanies(existing, [like]);
      if (compat.length === 0) {
        return NextResponse.json(
          { error: "الناقل المحدد غير متوافق مع بيانات الطلب" },
          { status: 400 },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.shipmentRequest.update({
          where: { id },
          data: {
            carrierId: carrierUserId,
            shipmentCompanyId: null,
            status: "CARRIER_ACCEPTED",
            carrierDecisionAt: new Date(),
            carrierSelfSubmittedDecision: false,
            ...workflowReset,
          },
          select: {
            id: true,
            status: true,
            shipmentCompanyId: true,
            carrierId: true,
            carrierDecisionAt: true,
          },
        });
        await tx.shipmentRequestInvitee.deleteMany({ where: { shipmentRequestId: id } });
        return u;
      });

      return NextResponse.json({ ok: true, request: updated });
    }

    const selectedCompany = await prisma.shipmentCompany.findUnique({
      where: { id: shipmentCompanyId },
      select: {
        id: true,
        blacklistedAt: true,
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
    if (selectedCompany.blacklistedAt) {
      return NextResponse.json({ error: "شركة الشحن محظورة ولا يمكن تعيينها" }, { status: 400 });
    }

    // Defensive check: ensure selected company is in current compatibility set.
    const companies = await prisma.shipmentCompany.findMany({
      where: { blacklistedAt: null },
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

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.shipmentRequest.update({
        where: { id },
        data: {
          shipmentCompanyId,
          status: "CARRIER_ACCEPTED",
          carrierDecisionAt: new Date(),
          carrierId: null,
          carrierSelfSubmittedDecision: false,
          ...workflowReset,
        },
        select: {
          id: true,
          status: true,
          shipmentCompanyId: true,
          carrierId: true,
          carrierDecisionAt: true,
        },
      });
      await tx.shipmentRequestInvitee.deleteMany({ where: { shipmentRequestId: id } });
      return u;
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
