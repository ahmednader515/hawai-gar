import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AR_LOCALE_LATN } from "@/lib/locale";

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: "في انتظار موافقة الإدارة",
  PENDING_DRIVER: "في انتظار رد شركة النقل",
  ACCEPTED: "مقبول",
  IN_PROGRESS: "قيد التنفيذ",
  DONE: "منتهي",
  REFUSED: "مرفوض",
  CANCELLED: "ملغى",
};

type CompanyOrderRow = {
  id: string;
  bookingNumber: string | null;
  status: string;
  createdAt: Date;
  fromLocation: { nameAr: string };
  toLocation: { nameAr: string };
  driver?: { name: string | null; driverProfile?: { carPlate: string | null; fullName: string } | null } | null;
};

export default async function CompanyOrdersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "COMPANY") return null;

  const orders = await prisma.order.findMany({
    where: { companyId: session.user.id },
    include: {
      fromLocation: { select: { nameAr: true } },
      toLocation: { select: { nameAr: true } },
      driver: {
        select: {
          driverProfile: { select: { carPlate: true, fullName: true } },
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = orders as unknown as CompanyOrderRow[];

  return (
    <div className="w-full min-w-0 max-w-full">
      <h1 className="text-2xl font-bold mb-6">طلباتي</h1>

      <Link
        href="/dashboard/company/new-order"
        className="mb-6 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
      >
        طلب نقل جديد
      </Link>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">لا توجد طلبات.</p>
      ) : (
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
                  شركة النقل: {o.driver?.driverProfile?.fullName ?? o.driver?.name ?? "—"} — لوحة{" "}
                  {o.driver?.driverProfile?.carPlate ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(o.createdAt).toLocaleDateString(AR_LOCALE_LATN)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
