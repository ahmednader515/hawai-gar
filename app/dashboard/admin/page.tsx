import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getTranslations } from "@/lib/i18n/server";
import { AdminShipmentList, type AdminShipmentRow } from "./admin-shipment-list";

type SummaryRow = {
  id: string;
  fromText: string;
  toText: string;
  shipmentType: string | null;
  distanceKm: number | null;
  priceSar: number | null;
  carrierDecisionAt: Date | null;
  adminDecisionAt: Date | null;
  status: string;
  containerSize: string | null;
  containersCount: string | null;
  pickupDate: string | null;
  notes: string | null;
  companyId: string | null;
  carrierId: string | null;
  shipmentCompany: {
    company_name: string | null;
  } | null;
};

export default async function AdminDashboardPage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "ADMIN") return null;

  const requests = await prisma.shipmentRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    select: {
      id: true,
      status: true,
      fromText: true,
      toText: true,
      shipmentType: true,
      distanceKm: true,
      priceSar: true,
      carrierDecisionAt: true,
      adminDecisionAt: true,
      containerSize: true,
      containersCount: true,
      pickupDate: true,
      notes: true,
      companyId: true,
      carrierId: true,
      shipmentCompany: {
        select: {
          company_name: true,
        },
      },
    },
  });

  const rows = requests as unknown as SummaryRow[];

  const idSet = new Set<string>();
  for (const r of rows) {
    if (r.companyId) idSet.add(r.companyId);
    if (r.carrierId) idSet.add(r.carrierId);
  }

  const users =
    idSet.size === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: Array.from(idSet) } },
          select: {
            id: true,
            companyProfile: { select: { companyName: true } },
            driverProfile: { select: { fullName: true, carPlate: true } },
          },
        });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const enriched: AdminShipmentRow[] = rows.map((o) => {
    const company = o.companyId ? userMap.get(o.companyId) : null;
    const carrier = o.carrierId ? userMap.get(o.carrierId) : null;
    return {
      id: o.id,
      fromText: o.fromText,
      toText: o.toText,
      shipmentType: o.shipmentType,
      distanceKm: o.distanceKm,
      priceSar: o.priceSar,
      carrierDecisionAt: o.carrierDecisionAt?.toISOString() ?? null,
      adminDecisionAt: o.adminDecisionAt?.toISOString() ?? null,
      status: o.status,
      containerSize: o.containerSize,
      containersCount: o.containersCount,
      pickupDate: o.pickupDate,
      notes: o.notes,
      companyName: company?.companyProfile?.companyName ?? null,
      carrierName: carrier?.driverProfile?.fullName ?? o.shipmentCompany?.company_name ?? null,
      carPlate: carrier?.driverProfile?.carPlate ?? null,
    };
  });

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <p className="text-xs font-medium text-muted-foreground mb-1">
        {t("dashboard.admin.adminWelcome")}
      </p>
      <h1 className="text-2xl font-bold mb-2 break-words">{t("dashboard.admin.shipmentRequestsTitle")}</h1>
      <p className="text-muted-foreground mb-6 text-sm md:text-base">
        {t("dashboard.admin.shipmentRequestsSubtitle")}
      </p>

      <AdminShipmentList rows={enriched} />
    </div>
  );
}
