import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { SupervisorOrdersList, type SupervisorOrderRow } from "./supervisor-orders-list";

type OrderRow = {
  id: string;
  status: string;
  createdAt: Date;
  fromLocation: { nameAr: string };
  toLocation: { nameAr: string };
  company?: { companyProfile?: { companyName: string } | null } | null;
  driver?: { name: string | null; driverProfile?: { fullName: string; carPlate: string } | null } | null;
};

export default async function SupervisorDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERVISOR") return null;

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

  const rows = orders as unknown as OrderRow[];

  const enriched: SupervisorOrderRow[] = rows.map((o) => ({
    id: o.id,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    fromName: o.fromLocation.nameAr,
    toName: o.toLocation.nameAr,
    companyName: o.company?.companyProfile?.companyName ?? null,
    carrierName: o.driver?.driverProfile?.fullName ?? o.driver?.name ?? null,
    carPlate: o.driver?.driverProfile?.carPlate ?? null,
  }));

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <h1 className="text-2xl font-bold mb-2 break-words">جميع الطلبات</h1>
      <p className="text-muted-foreground mb-6 text-sm md:text-base">
        ابحث بين الطلبات ثم افتح التفاصيل لعرض المزيد.
      </p>
      <SupervisorOrdersList rows={enriched} />
    </div>
  );
}
