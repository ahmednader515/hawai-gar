import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { MapboxLocationPreview } from "@/components/mapbox-location-preview";

function formatSar(v: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(v);
}

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: "في انتظار موافقة الإدارة",
  PENDING_DRIVER: "في انتظار الرد",
  ACCEPTED: "مقبول",
  IN_PROGRESS: "قيد التنفيذ",
  DONE: "منتهي",
  REFUSED: "مرفوض",
  CANCELLED: "ملغى",
};

type ClientOrderRow = {
  id: string;
  bookingNumber: string | null;
  status: string;
  createdAt: Date;
  fromLocation: { nameAr: string };
  toLocation: { nameAr: string };
  company?: { companyProfile?: { companyName: string } | null } | null;
};

export default async function ClientOrdersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DRIVER") return null;

  const approvedShipmentRequests = await prisma.shipmentRequest.findMany({
    where: {
      status: "ADMIN_APPROVED",
      carrierId: session.user.id,
    },
    orderBy: { adminDecisionAt: "desc" },
    take: 50,
  });

  const orders = await prisma.order.findMany({
    where: {
      driverId: session.user.id,
      status: { not: "PENDING_APPROVAL" },
    },
    include: {
      fromLocation: { select: { nameAr: true } },
      toLocation: { select: { nameAr: true } },
      company: {
        select: {
          companyProfile: { select: { companyName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = orders as unknown as ClientOrderRow[];
  const hasAny = approvedShipmentRequests.length > 0 || rows.length > 0;

  return (
    <div className="w-full min-w-0 max-w-full">
      <h1 className="text-2xl font-bold mb-6">طلباتي</h1>
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">طلبات الشحن المعتمدة</h2>
        {approvedShipmentRequests.length === 0 ? (
          <p className="text-muted-foreground">لا توجد طلبات معتمدة حتى الآن.</p>
        ) : (
          <div className="space-y-3">
            {approvedShipmentRequests.map((r) => (
              <Card key={r.id} className="min-w-0 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <span className="font-medium min-w-0 break-words">
                      من {r.fromText} → إلى {r.toText}
                    </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {r.adminDecisionAt ? new Date(r.adminDecisionAt).toLocaleString("ar-SA") : "—"}
                    </span>
                    <Link
                      href={`/dashboard/client/shipment-requests/${r.id}`}
                      className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted whitespace-nowrap"
                    >
                      تفاصيل
                    </Link>
                  </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-sm text-muted-foreground break-words">
                    حجم الحاوية: {r.containerSize ?? "—"} — العدد: {r.containersCount ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground break-words">
                    رقم الطلب: <span className="font-mono">{r.id}</span>
                  </p>
                  <p className="text-sm text-muted-foreground break-words">
                    المسافة: {typeof r.distanceKm === "number" ? `${r.distanceKm.toFixed(1)} كم` : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground break-words">
                    {r.status === "ADMIN_APPROVED" ? "السعر النهائي" : "السعر التقديري"}:{" "}
                    {typeof r.priceSar === "number" ? formatSar(r.priceSar) : "—"}
                  </p>
                  {r.status === "ADMIN_APPROVED" &&
                    r.adminPriceChanged &&
                    typeof r.estimatedPriceSar === "number" &&
                    typeof r.priceSar === "number" && (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 p-3 text-sm">
                        تم تعديل السعر بواسطة الأدمن من{" "}
                        <span className="font-semibold">{formatSar(r.estimatedPriceSar)}</span> إلى{" "}
                        <span className="font-semibold">{formatSar(r.priceSar)}</span>.
                      </div>
                    )}
                  <p className="text-sm text-muted-foreground break-words">
                    نوع الشحنة: {r.shipmentType ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground break-words">
                    تاريخ الاستلام: {r.pickupDate ?? "—"}
                  </p>
                  {r.notes && (
                    <p className="text-sm text-foreground break-words">
                      ملاحظات: {r.notes}
                    </p>
                  )}
                  {r.fromLat != null &&
                    r.fromLng != null &&
                    r.toLat != null &&
                    r.toLng != null && (
                      <div className="mt-3">
                        <MapboxLocationPreview
                          from={{ lat: r.fromLat, lng: r.fromLng }}
                          to={{ lat: r.toLat, lng: r.toLng }}
                          heightClassName="h-28 sm:h-32"
                        />
                      </div>
                    )}
                  <p className="text-xs text-muted-foreground pt-2">
                    الحالة: معتمد
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {rows.length === 0 ? null : (
        <div className="space-y-4">
          {rows.map((o) => (
            <Card key={o.id} className="min-w-0 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start">
                  <span className="font-medium min-w-0 break-words">
                    من {o.fromLocation.nameAr} → إلى {o.toLocation.nameAr}
                  </span>
                  <span className="text-sm text-muted-foreground shrink-0">
                    {statusLabels[o.status] ?? o.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">رقم الحجز: {o.bookingNumber ?? "—"}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground break-words">
                  الشركة: {o.company?.companyProfile?.companyName ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(o.createdAt).toLocaleDateString("ar-SA")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!hasAny && <p className="text-muted-foreground">لا توجد طلبات.</p>}
    </div>
  );
}
