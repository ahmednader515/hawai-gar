import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function formatSar(v: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_CARRIER: "بانتظار قرار شركة النقل",
  CARRIER_ACCEPTED: "بانتظار قرار الأدمن",
  CARRIER_REFUSED: "تم رفض الطلب من شركة النقل",
  ADMIN_APPROVED: "تمت الموافقة النهائية",
  ADMIN_REJECTED: "تم الرفض النهائي",
};

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
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "ADMIN") return null;

  const requests = await prisma.shipmentRequest.findMany({
    where: { status: { in: ["CARRIER_ACCEPTED", "ADMIN_APPROVED", "ADMIN_REJECTED"] } },
    orderBy: [{ carrierDecisionAt: "desc" }, { adminDecisionAt: "desc" }, { createdAt: "desc" }],
    take: 50,
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

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <h1 className="text-2xl font-bold mb-6 break-words">طلبات الشحن (بانتظار/قرار الأدمن)</h1>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">لا توجد طلبات.</p>
      ) : (
        <div className="space-y-4 min-w-0 overflow-hidden">
          {rows.map((o) => {
            const company = o.companyId ? userMap.get(o.companyId) : null;
            const carrier = o.carrierId ? userMap.get(o.carrierId) : null;
            return (
              <Card
                key={o.id}
                className="min-w-0 w-full overflow-hidden border border-border max-md:py-5 max-md:px-4"
              >
                <CardHeader className="pb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between min-w-0 max-md:gap-3 max-md:pb-3">
                  <span className="font-medium min-w-0 break-words max-md:text-base">
                    من {o.fromText} → إلى {o.toText}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {STATUS_LABELS[o.status] ?? o.status}
                      {o.adminDecisionAt
                        ? ` — ${new Date(o.adminDecisionAt).toLocaleString("ar-SA")}`
                        : o.carrierDecisionAt
                          ? ` — ${new Date(o.carrierDecisionAt).toLocaleString("ar-SA")}`
                          : ""}
                    </span>
                    <Link
                      href={`/dashboard/admin/shipment-requests/${o.id}`}
                      className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted whitespace-nowrap shrink-0"
                    >
                      تفاصيل
                    </Link>
                  </div>
                </CardHeader>

                <CardContent className="min-w-0 max-md:pt-1 space-y-1">
                  <p className="text-sm text-muted-foreground break-words max-md:text-base">
                    الشركة: {company?.companyProfile?.companyName ?? "—"} — شركة النقل:{" "}
                    {carrier?.driverProfile?.fullName ?? "—"}
                    {carrier?.driverProfile?.carPlate ? ` (${carrier.driverProfile.carPlate})` : ""}
                  </p>

                  <p className="text-sm text-muted-foreground break-words">
                    نوع الشحنة: {o.shipmentType ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground break-words">
                    المسافة: {typeof o.distanceKm === "number" ? `${o.distanceKm.toFixed(1)} كم` : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground break-words">
                    السعر: {typeof o.priceSar === "number" ? formatSar(o.priceSar) : "—"}
                  </p>

                  <p className="text-sm text-muted-foreground break-words">
                    حجم الحاوية: {o.containerSize ?? "—"} — العدد: {o.containersCount ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground break-words">
                    تاريخ الاستلام: {o.pickupDate ?? "—"}
                  </p>

                  {o.notes && <p className="text-sm text-foreground break-words">ملاحظات: {o.notes}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
