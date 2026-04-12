/** Which green banner to show to the platform driver on client shipment UI. */
export type CarrierAckVariant = "none" | "self" | "admin";

export function getCarrierAckVariant(
  carrierId: string | null,
  userId: string,
  status: string,
  carrierSelfSubmittedDecision: boolean,
): CarrierAckVariant {
  if (!carrierId || carrierId !== userId) return "none";
  if (
    carrierSelfSubmittedDecision &&
    (status === "CARRIER_REFUSED" || status === "CARRIER_ACCEPTED")
  ) {
    return "self";
  }
  if (
    !carrierSelfSubmittedDecision &&
    ["CARRIER_ACCEPTED", "ADMIN_APPROVED", "AWAITING_PAYMENT_APPROVAL", "COMPLETE"].includes(status)
  ) {
    return "admin";
  }
  return "none";
}
