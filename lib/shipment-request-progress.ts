/** Maps DB status → progress 0–100 for the shipment journey bar. */
export function getShipmentRequestProgressPercent(status: string): number {
  switch (status) {
    case "PENDING_CARRIER":
      return 12;
    case "CARRIER_ACCEPTED":
    case "CARRIER_REFUSED":
      return 32;
    case "ADMIN_APPROVED":
      return 56;
    case "AWAITING_PAYMENT_APPROVAL":
      return 78;
    case "COMPLETE":
      return 100;
    case "ADMIN_REJECTED":
      return 28;
    default:
      return 8;
  }
}

export function isShipmentRequestRejected(status: string): boolean {
  return status === "ADMIN_REJECTED";
}
