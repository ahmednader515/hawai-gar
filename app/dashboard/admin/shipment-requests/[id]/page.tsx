import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ShipmentRequestAdminActions } from "../shipment-request-admin-actions";

export default async function AdminShipmentRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const r = await prisma.shipmentRequest.findUnique({ where: { id } });
  if (!r) redirect("/dashboard/admin/shipment-requests");

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <Link
        href="/dashboard/admin/shipment-requests"
        className="text-sm text-muted-foreground hover:underline inline-block"
      >
        ← طلبات الشحن
      </Link>

      <h1 className="text-2xl font-bold">تفاصيل طلب الشحن</h1>

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
          <p className="text-muted-foreground">الحالة: {r.status}</p>
          <p className="text-muted-foreground">
            قرار شركة النقل: {r.carrierId ? "تم اتخاذ قرار" : "لم يتم بعد"}
            {r.carrierDecisionAt ? ` — ${new Date(r.carrierDecisionAt).toLocaleString("ar-SA")}` : ""}
          </p>
          <p className="text-muted-foreground">
            قرار الأدمن: {r.adminId ? "تم اتخاذ قرار" : "لم يتم بعد"}
            {r.adminDecisionAt ? ` — ${new Date(r.adminDecisionAt).toLocaleString("ar-SA")}` : ""}
          </p>
          <p className="text-muted-foreground">
            حجم الحاوية: {r.containerSize ?? "—"} — العدد: {r.containersCount ?? "—"}
          </p>
          <p className="text-muted-foreground">تاريخ الاستلام: {r.pickupDate ?? "—"}</p>
          <p className="text-muted-foreground">رقم التواصل: {r.phone ?? "—"}</p>
          {r.notes && <p className="break-words">ملاحظات: {r.notes}</p>}
          <p className="text-xs text-muted-foreground pt-2">ID: {r.id}</p>

          <ShipmentRequestAdminActions id={r.id} status={r.status} />
        </CardContent>
      </Card>
    </div>
  );
}

