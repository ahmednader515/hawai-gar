import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: "في انتظار موافقة الإدارة",
  PENDING_DRIVER: "في انتظار رد السائق",
  ACCEPTED: "مقبول",
  IN_PROGRESS: "قيد التنفيذ",
  DONE: "منتهي",
  REFUSED: "مرفوض",
  CANCELLED: "ملغى",
};

type AdminOrderRow = {
  id: string;
  status: string;
  createdAt: Date;
  fromLocation: { nameAr: string };
  toLocation: { nameAr: string };
  company?: { companyProfile?: { companyName: string } | null } | null;
  driver?: { name: string | null; driverProfile?: { fullName: string; carPlate: string } | null } | null;
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const role = session.user.role;
  if (role !== "ADMIN") return null;

  const orders = await prisma.order.findMany({
    include: {
      fromLocation: { select: { nameAr: true } },
      toLocation: { select: { nameAr: true } },
      company: {
        select: {
          companyProfile: { select: { companyName: true } },
        },
      },
      driver: {
        select: {
          driverProfile: { select: { fullName: true, carPlate: true } },
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = orders as unknown as AdminOrderRow[];

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <h1 className="text-2xl font-bold mb-6 break-words">جميع الطلبات</h1>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">لا توجد طلبات.</p>
      ) : (
        <div className="space-y-4 min-w-0 overflow-hidden">
          {rows.map((o) => (
            <Card key={o.id} className="min-w-0 w-full overflow-hidden border border-border max-md:py-5 max-md:px-4">
              <CardHeader className="pb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between min-w-0 max-md:gap-3 max-md:pb-3">
                <span className="font-medium min-w-0 break-words max-md:text-base">
                  من {o.fromLocation.nameAr} → إلى {o.toLocation.nameAr}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {statusLabels[o.status] ?? o.status}
                  </span>
                  <Link
                    href={`/dashboard/admin/orders/${o.id}`}
                    className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted whitespace-nowrap shrink-0"
                  >
                    تفاصيل
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="min-w-0 max-md:pt-1">
                <p className="text-sm text-muted-foreground break-words max-md:text-base">
                  الشركة: {o.company?.companyProfile?.companyName ?? "—"} — السائق:{" "}
                  {o.driver?.driverProfile?.fullName ?? o.driver?.name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 break-words max-md:text-sm">
                  {new Date(o.createdAt).toLocaleDateString("ar-SA")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
