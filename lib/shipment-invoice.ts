import { prisma } from "@/lib/db";
import {
  getShipmentInvoiceSettings,
  type InvoiceBankAccount,
  type ShipmentInvoiceSettings,
} from "@/lib/shipment-invoice-settings";

export type InvoiceViewer = {
  userId: string;
  role: string;
};

export type ShipmentInvoiceData = {
  requestId: string;
  invoiceNumber: string;
  issuedAt: Date;
  status: string;
  companyId: string | null;
  fromText: string;
  toText: string;
  shipmentType: string | null;
  containerSize: string | null;
  containersCount: string | null;
  contactPhone: string | null;
  distanceKm: number | null;
  pickupDate: string | null;
  unloadPermitRequired: boolean;
  notes: string | null;
  finalPriceSar: number;
  settings: ShipmentInvoiceSettings;
  bankAccounts: InvoiceBankAccount[];
};

export async function getShipmentInvoiceData(
  requestId: string,
  viewer: InvoiceViewer,
): Promise<ShipmentInvoiceData | null> {
  const request = await prisma.shipmentRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      companyId: true,
      status: true,
      fromText: true,
      toText: true,
      shipmentType: true,
      containerSize: true,
      containersCount: true,
      phone: true,
      distanceKm: true,
      pickupDate: true,
      unloadPermitRequired: true,
      notes: true,
      priceSar: true,
      adminDecisionAt: true,
      createdAt: true,
    },
  });
  if (!request || typeof request.priceSar !== "number") return null;
  if (
    viewer.role !== "ADMIN" &&
    (viewer.role !== "COMPANY" || !request.companyId || request.companyId !== viewer.userId)
  ) {
    return null;
  }
  if (
    request.status !== "ADMIN_APPROVED" &&
    request.status !== "AWAITING_PAYMENT_APPROVAL" &&
    request.status !== "COMPLETE"
  ) {
    return null;
  }

  const settings = await getShipmentInvoiceSettings();
  const issuedAt = request.adminDecisionAt ?? request.createdAt;
  return {
    requestId: request.id,
    invoiceNumber: `INV-${request.id}`,
    issuedAt,
    status: request.status,
    companyId: request.companyId ?? null,
    fromText: request.fromText,
    toText: request.toText,
    shipmentType: request.shipmentType,
    containerSize: request.containerSize ?? null,
    containersCount: request.containersCount ?? null,
    contactPhone: request.phone ?? null,
    distanceKm: request.distanceKm ?? null,
    pickupDate: request.pickupDate ?? null,
    unloadPermitRequired: request.unloadPermitRequired,
    notes: request.notes ?? null,
    finalPriceSar: request.priceSar,
    bankAccounts: settings.bankAccounts,
    settings,
  };
}

