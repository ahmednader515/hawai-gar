import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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

  return (
    <div className="w-full min-w-0 max-w-full">
      <h1 className="text-2xl font-bold mb-6">طلباتي</h1>
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
    </div>
  );
}
