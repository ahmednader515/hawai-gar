import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type RequestOrderRow = {
  id: string;
  bookingNumber: string | null;
  createdAt: Date;
  fromLocation: { nameAr: string };
  toLocation: { nameAr: string };
  company?: { companyProfile?: { companyName: string } | null } | null;
};

export default async function DriverRequestsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DRIVER") return null;

  const orders = await prisma.order.findMany({
    where: {
      driverId: session.user.id,
      status: "PENDING_APPROVAL",
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

  const rows = orders as unknown as RequestOrderRow[];

  return (
    <div className="w-full min-w-0 max-w-full">
      <h1 className="text-2xl font-bold mb-6">الطلبات الواردة</h1>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">لا توجد طلبات مخصصة لك بانتظار موافقة الإدارة.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((o) => (
            <Card key={o.id} className="min-w-0 overflow-hidden">
              <CardHeader className="pb-2">
                <span className="font-medium break-words">
                  من {o.fromLocation.nameAr} → إلى {o.toLocation.nameAr}
                </span>
                <p className="text-sm text-muted-foreground break-words">
                  الشركة: {o.company?.companyProfile?.companyName ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">رقم الحجز: {o.bookingNumber ?? "—"}</p>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(o.createdAt).toLocaleDateString("ar-SA")}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                  بانتظار موافقة الإدارة — سيتم إشعارك عند القبول أو الرفض.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
