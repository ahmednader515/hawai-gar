import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapboxLocationPreview } from "@/components/mapbox-location-preview";
import { ShipmentRequestAdminActions } from "../shipment-request-admin-actions";

const STATUS_LABELS: Record<string, string> = {
  PENDING_CARRIER: "بانتظار قرار شركة النقل",
  CARRIER_ACCEPTED: "تم قبول الطلب من شركة النقل",
  CARRIER_REFUSED: "تم رفض الطلب من شركة النقل",
  ADMIN_APPROVED: "تمت الموافقة النهائية",
  ADMIN_REJECTED: "تم الرفض النهائي",
};

function formatSar(v: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

export default async function AdminShipmentRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const r = await prisma.shipmentRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      carrierDecisionAt: true,

      companyId: true,
      carrierId: true,

      fromText: true,
      toText: true,
      shipmentType: true,

      fromLat: true,
      fromLng: true,
      toLat: true,
      toLng: true,

      distanceKm: true,
      priceSar: true,

      containerSize: true,
      containersCount: true,
      pickupDate: true,
      notes: true,
      phone: true,
    },
  });

  if (!r) redirect("/dashboard/admin");

  const [companyUser, carrierUser] = await Promise.all([
    r.companyId
      ? prisma.user.findUnique({
          where: { id: r.companyId },
          select: {
            email: true,
            companyProfile: {
              select: {
                companyName: true,
                contactPerson: true,
                phone: true,
                address: true,
                city: true,
              },
            },
          },
        })
      : Promise.resolve(null),
    r.carrierId
      ? prisma.user.findUnique({
          where: { id: r.carrierId },
          select: {
            email: true,
            driverProfile: {
              select: {
                fullName: true,
                phone: true,
                carPlate: true,
                carType: true,
                licenseNumber: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const hasCoords =
    r.fromLat != null && r.fromLng != null && r.toLat != null && r.toLng != null;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard/admin"
          className="text-sm text-muted-foreground hover:underline inline-block"
        >
          ← الطلبات
        </Link>
        <h1 className="text-2xl font-bold">تفاصيل طلب الشحن</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <span className="font-medium min-w-0 break-words">
              من {r.fromText} → إلى {r.toText}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {STATUS_LABELS[r.status] ?? r.status}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-muted-foreground">نوع الشحنة</div>
              <div className="font-medium">{r.shipmentType ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">حجم الحاوية/عددها</div>
              <div className="font-medium">
                {r.containerSize ?? "—"} — {r.containersCount ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">تاريخ الاستلام</div>
              <div className="font-medium">{r.pickupDate ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">رقم التواصل</div>
              <div className="font-medium">{r.phone ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">المسافة</div>
              <div className="font-medium">
                {typeof r.distanceKm === "number" ? `${r.distanceKm.toFixed(1)} كم` : "—"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">السعر (قابل للتعديل)</div>
              <div className="font-medium">
                {typeof r.priceSar === "number" ? formatSar(r.priceSar) : "—"}
              </div>
            </div>
          </div>

          {r.notes && (
            <div>
              <div className="text-muted-foreground">ملاحظات</div>
              <div className="break-words">{r.notes}</div>
            </div>
          )}

          {hasCoords && (
            <div>
              <div className="text-muted-foreground mb-2">خريطة الموقع</div>
              <MapboxLocationPreview
                from={{ lat: r.fromLat as number, lng: r.fromLng as number }}
                to={{ lat: r.toLat as number, lng: r.toLng as number }}
                heightClassName="h-64"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="text-muted-foreground mb-2">بيانات الشركة</div>
              {companyUser?.companyProfile ? (
                <div className="space-y-1.5">
                  <div className="font-medium">{companyUser.companyProfile.companyName}</div>
                  <div className="text-muted-foreground">
                    المسؤول: {companyUser.companyProfile.contactPerson}
                  </div>
                  <div className="text-muted-foreground">الهاتف: {companyUser.companyProfile.phone}</div>
                  {companyUser.companyProfile.address && (
                    <div className="text-muted-foreground">
                      العنوان: {companyUser.companyProfile.address}
                    </div>
                  )}
                  {companyUser.companyProfile.city && (
                    <div className="text-muted-foreground">
                      المدينة: {companyUser.companyProfile.city}
                    </div>
                  )}
                  {companyUser.email && <div className="text-muted-foreground">البريد: {companyUser.email}</div>}
                </div>
              ) : (
                <div className="text-muted-foreground">—</div>
              )}
            </div>

            <div>
              <div className="text-muted-foreground mb-2">بيانات شركة النقل المقبولة</div>
              {carrierUser?.driverProfile ? (
                <div className="space-y-1.5">
                  <div className="font-medium">{carrierUser.driverProfile.fullName}</div>
                  <div className="text-muted-foreground">الهاتف: {carrierUser.driverProfile.phone}</div>
                  <div className="text-muted-foreground">
                    لوحة المركبة: {carrierUser.driverProfile.carPlate}
                  </div>
                  {carrierUser.driverProfile.carType && (
                    <div className="text-muted-foreground">
                      نوع المركبة: {carrierUser.driverProfile.carType}
                    </div>
                  )}
                  {carrierUser.driverProfile.licenseNumber && (
                    <div className="text-muted-foreground">
                      رخصة: {carrierUser.driverProfile.licenseNumber}
                    </div>
                  )}
                  {carrierUser.email && <div className="text-muted-foreground">البريد: {carrierUser.email}</div>}
                </div>
              ) : (
                <div className="text-muted-foreground">—</div>
              )}
            </div>
          </div>

          <div className="pt-3">
            <ShipmentRequestAdminActions id={r.id} status={r.status} priceSar={r.priceSar ?? null} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

