import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ClientRequestsPageContent } from "./client-requests-page-content";

type RequestOrderRow = {
  id: string;
  bookingNumber: string | null;
  createdAt: Date;
  fromLocation: { nameAr: string };
  toLocation: { nameAr: string };
  company?: { companyProfile?: { companyName: string } | null } | null;
};

export default async function ClientRequestsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DRIVER") return null;

  const shipmentRequests = await prisma.shipmentRequest.findMany({
    where: {
      status: {
        notIn: ["ADMIN_APPROVED", "AWAITING_PAYMENT_APPROVAL", "COMPLETE", "ADMIN_REJECTED"],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  /** Approved requests live under «طلباتي»; still warn if this driver has price-adjusted approvals. */
  const priceChangedApprovedCount = await prisma.shipmentRequest.count({
    where: {
      status: "ADMIN_APPROVED",
      adminPriceChanged: true,
      carrierId: session.user.id,
    },
  });

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

  const shipments = shipmentRequests.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
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

  const legacyOrders = rows.map((o) => ({
    id: o.id,
    bookingNumber: o.bookingNumber,
    createdAt: o.createdAt.toISOString(),
    fromName: o.fromLocation.nameAr,
    toName: o.toLocation.nameAr,
    companyName: o.company?.companyProfile?.companyName ?? null,
  }));

  return (
    <ClientRequestsPageContent
      priceChangedApprovedCount={priceChangedApprovedCount}
      shipments={shipments}
      legacyOrders={legacyOrders}
    />
  );
}
