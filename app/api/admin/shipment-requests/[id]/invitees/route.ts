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

type InviteeItem = { kind: "DRIVER" | "COMPANY"; targetId: string };

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
    const body = (await req.json()) as { items?: InviteeItem[] };
    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "اختر ناقلاً واحداً على الأقل" }, { status: 400 });
    }

    const seen = new Set<string>();
    for (const it of items) {
      if (it.kind !== "DRIVER" && it.kind !== "COMPANY") {
        return NextResponse.json({ error: "نوع الناقل غير صالح" }, { status: 400 });
      }
      const tid = String(it.targetId ?? "").trim();
      if (!tid) {
        return NextResponse.json({ error: "معرّف الناقل مطلوب" }, { status: 400 });
      }
      const k = `${it.kind}:${tid}`;
      if (seen.has(k)) {
        return NextResponse.json({ error: "لا تكرّر نفس الناقل" }, { status: 400 });
      }
      seen.add(k);
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
        { error: "لا يمكن تعديل قائمة الناقلين في هذه الحالة" },
        { status: 400 },
      );
    }

    const workflowReset = shouldClearWorkflowOnCarrierChange(existing.status)
      ? workflowFieldsClearedOnCarrierChange()
      : {};

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
    const compatibleCompanyIds = new Set(
      getCompatibleShipmentCompanies(existing, companies).map((c) => c.company.id),
    );

    const platformDrivers = await prisma.user.findMany({
      where: { role: UserRole.DRIVER, blacklistedAt: null },
      include: { driverProfile: true },
    });

    for (const it of items) {
      if (it.kind === "COMPANY") {
        if (!compatibleCompanyIds.has(it.targetId)) {
          return NextResponse.json(
            { error: "إحدى شركات الدليل غير متوافقة مع الطلب" },
            { status: 400 },
          );
        }
        continue;
      }
      const driverUser = platformDrivers.find((u) => u.id === it.targetId);
      if (!driverUser?.driverProfile) {
        return NextResponse.json({ error: "أحد الناقلين غير موجود" }, { status: 400 });
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
          { error: "أحد الناقلين غير متوافق مع بيانات الطلب" },
          { status: 400 },
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.shipmentRequestInvitee.deleteMany({ where: { shipmentRequestId: id } });
      await tx.shipmentRequestInvitee.createMany({
        data: items.map((it) => ({
          shipmentRequestId: id,
          kind: it.kind,
          targetId: it.targetId,
        })),
      });
      await tx.shipmentRequest.update({
        where: { id },
        data: {
          status: "PENDING_CARRIER",
          carrierId: null,
          shipmentCompanyId: null,
          carrierDecisionAt: null,
          carrierSelfSubmittedDecision: false,
          ...workflowReset,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
