import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ClientOrdersPageContent } from "./client-orders-page-content";

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

  const approvedShipmentRequests = await prisma.shipmentRequest.findMany({
    where: {
      carrierId: session.user.id,
      status: {
        in: ["ADMIN_APPROVED", "AWAITING_PAYMENT_APPROVAL", "COMPLETE"],
      },
    },
    orderBy: { adminDecisionAt: "desc" },
    take: 50,
  });

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

  const approvedShipments = approvedShipmentRequests.map((r) => ({
    id: r.id,
    status: r.status,
    adminDecisionAt: r.adminDecisionAt?.toISOString() ?? null,
    fromText: r.fromText,
    toText: r.toText,
    containerSize: r.containerSize,
    containersCount: r.containersCount,
    distanceKm: r.distanceKm,
    priceSar: r.priceSar,
    estimatedPriceSar: r.estimatedPriceSar,
    adminPriceChanged: r.adminPriceChanged,
    adminPriceChangeNotice: r.adminPriceChangeNotice,
    shipmentType: r.shipmentType,
    pickupDate: r.pickupDate,
    notes: r.notes,
    fromLat: r.fromLat,
    fromLng: r.fromLng,
    toLat: r.toLat,
    toLng: r.toLng,
  }));

  const serializedOrders = rows.map((o) => ({
    id: o.id,
    bookingNumber: o.bookingNumber,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    fromName: o.fromLocation.nameAr,
    toName: o.toLocation.nameAr,
    companyName: o.company?.companyProfile?.companyName ?? null,
  }));

  return (
    <ClientOrdersPageContent approvedShipments={approvedShipments} orders={serializedOrders} />
  );
}
