import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ShipmentRequestActions } from "../../requests/shipment-request-actions";
import { MapboxLocationPreview } from "@/components/mapbox-location-preview";

function formatSar(v: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(v);
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_CARRIER: "بانتظار قرار شركة النقل",
  CARRIER_ACCEPTED: "بانتظار قرار الأدمن بقبول أو رفض الطلب",
  CARRIER_REFUSED: "بانتظار قرار الأدمن بقبول أو رفض الطلب",
  ADMIN_APPROVED: "تمت الموافقة النهائية",
  ADMIN_REJECTED: "تم الرفض النهائي",
};

export default async function ClientShipmentRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "DRIVER") redirect("/dashboard");

  const { id } = await params;
  const r = await prisma.shipmentRequest.findUnique({ where: { id } });
  if (!r) redirect("/dashboard/client/requests");

  // If carrier already accepted/refused, only show to that carrier.
  if (r.carrierId && r.carrierId !== session.user.id) {
    redirect("/dashboard/client/requests");
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <Link
        href="/dashboard/client/requests"
        className="text-sm text-muted-foreground hover:underline inline-block"
      >
        ← الطلبات الواردة
      </Link>

      <h1 className="text-2xl font-bold">تفاصيل طلب النقل</h1>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <span className="font-medium min-w-0 break-words">
              من {r.fromText} → إلى {r.toText}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(r.createdAt).toLocaleString("ar-SA")}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">الحالة: {STATUS_LABELS[r.status] ?? r.status}</p>
          <p className="text-muted-foreground">
            حجم الحاوية: {r.containerSize ?? "—"} — العدد: {r.containersCount ?? "—"}
          </p>
          <p className="text-muted-foreground">
            نوع الشحنة: {r.shipmentType ?? "—"}
          </p>
          <p className="text-muted-foreground">
            المسافة: {typeof r.distanceKm === "number" ? `${r.distanceKm.toFixed(1)} كم` : "—"}
          </p>
          <p className="text-muted-foreground">
            {r.status === "ADMIN_APPROVED" ? "السعر النهائي" : "السعر التقديري"}:{" "}
            {typeof r.priceSar === "number" ? formatSar(r.priceSar) : "—"}
          </p>
          <p className="text-muted-foreground">تاريخ الاستلام: {r.pickupDate ?? "—"}</p>
          {r.notes && <p className="break-words">ملاحظات: {r.notes}</p>}
          {r.fromLat != null &&
            r.fromLng != null &&
            r.toLat != null &&
            r.toLng != null && (
              <div className="mt-3">
                <MapboxLocationPreview
                  from={{ lat: r.fromLat, lng: r.fromLng }}
                  to={{ lat: r.toLat, lng: r.toLng }}
                  heightClassName="h-56"
                  interactive
                />
                <div className="mt-3 text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-sm bg-[#1b8254]" aria-hidden />
                    من
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-sm bg-[#f59e0b]" aria-hidden />
                    إلى
                  </div>
                </div>
              </div>
            )}
          <p className="text-xs text-muted-foreground pt-2">ID: {r.id}</p>

          <ShipmentRequestActions id={r.id} status={r.status} />
        </CardContent>
      </Card>
    </div>
  );
}

