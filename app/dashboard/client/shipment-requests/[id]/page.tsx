import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ShipmentRequestActions } from "../../requests/shipment-request-actions";

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
          <p className="text-muted-foreground">الحالة: {r.status}</p>
          <p className="text-muted-foreground">
            حجم الحاوية: {r.containerSize ?? "—"} — العدد: {r.containersCount ?? "—"}
          </p>
          <p className="text-muted-foreground">تاريخ الاستلام: {r.pickupDate ?? "—"}</p>
          {r.notes && <p className="break-words">ملاحظات: {r.notes}</p>}
          <p className="text-xs text-muted-foreground pt-2">ID: {r.id}</p>

          <ShipmentRequestActions id={r.id} status={r.status} />
        </CardContent>
      </Card>
    </div>
  );
}

