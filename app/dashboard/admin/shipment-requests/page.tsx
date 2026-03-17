import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ShipmentRequestAdminActions } from "./shipment-request-admin-actions";

export default async function AdminShipmentRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const list = await prisma.shipmentRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="w-full min-w-0 max-w-full">
      <h1 className="text-2xl font-bold mb-6">طلبات الشحن (من الصفحة الرئيسية)</h1>
      {list.length === 0 ? (
        <p className="text-muted-foreground">لا توجد طلبات حتى الآن.</p>
      ) : (
        <div className="space-y-4">
          {list.map((r) => (
            <Card key={r.id} className="min-w-0 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <span className="font-medium min-w-0 break-words">
                    من {r.fromText} → إلى {r.toText}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("ar-SA")}
                    </span>
                    <Link
                      href={`/dashboard/admin/shipment-requests/${r.id}`}
                      className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted whitespace-nowrap"
                    >
                      تفاصيل
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-xs text-muted-foreground break-words">
                  الحالة: {r.status}
                </p>
                <p className="text-xs text-muted-foreground break-words">
                  قرار شركة النقل: {r.carrierId ? "تم اتخاذ قرار" : "لم يتم بعد"}
                  {r.carrierDecisionAt ? ` — ${new Date(r.carrierDecisionAt).toLocaleString("ar-SA")}` : ""}
                </p>
                <p className="text-xs text-muted-foreground break-words">
                  قرار الأدمن: {r.adminId ? "تم اتخاذ قرار" : "لم يتم بعد"}
                  {r.adminDecisionAt ? ` — ${new Date(r.adminDecisionAt).toLocaleString("ar-SA")}` : ""}
                </p>
                <p className="text-sm text-muted-foreground break-words">
                  حجم الحاوية: {r.containerSize ?? "—"} — العدد: {r.containersCount ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground break-words">
                  تاريخ الاستلام: {r.pickupDate ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground break-words">
                  رقم التواصل: {r.phone ?? "—"}
                </p>
                {r.notes && (
                  <p className="text-sm text-foreground break-words">
                    ملاحظات: {r.notes}
                  </p>
                )}
                <p className="text-xs text-muted-foreground break-words pt-2">
                  ID: {r.id}
                </p>
                <ShipmentRequestAdminActions id={r.id} status={r.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

