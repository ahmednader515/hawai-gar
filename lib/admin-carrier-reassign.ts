/** Admin may change carrier / shortlist until the request is completed. */
export const ADMIN_CARRIER_REASSIGN_STATUSES = [
  "PENDING_CARRIER",
  "CARRIER_REFUSED",
  "CARRIER_ACCEPTED",
  "ADMIN_APPROVED",
  "AWAITING_PAYMENT_APPROVAL",
  "ADMIN_REJECTED",
] as const;

export function allowsAdminCarrierReassign(status: string): boolean {
  return (ADMIN_CARRIER_REASSIGN_STATUSES as readonly string[]).includes(status);
}

/** When true, changing carrier clears invoice/payment proof and admin decision so the flow can run again. */
export function shouldClearWorkflowOnCarrierChange(fromStatus: string): boolean {
  return (
    fromStatus === "CARRIER_ACCEPTED" ||
    fromStatus === "ADMIN_APPROVED" ||
    fromStatus === "AWAITING_PAYMENT_APPROVAL" ||
    fromStatus === "ADMIN_REJECTED"
  );
}

export function workflowFieldsClearedOnCarrierChange(): {
  invoiceLink: null;
  invoiceImageUrl: null;
  adminId: null;
  adminDecisionAt: null;
  adminPriceChanged: boolean;
  adminPriceChangeNotice: null;
} {
  return {
    invoiceLink: null,
    invoiceImageUrl: null,
    adminId: null,
    adminDecisionAt: null,
    adminPriceChanged: false,
    adminPriceChangeNotice: null,
  };
}
