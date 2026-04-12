import type { Prisma } from "@prisma/client";

/** If any DRIVER invitee rows exist, only those drivers see the request; otherwise all drivers see it (legacy). */
export function shipmentRequestVisibleToDriverWhere(
  driverUserId: string,
): Prisma.ShipmentRequestWhereInput {
  return {
    OR: [
      { invitees: { none: { kind: "DRIVER" } } },
      { invitees: { some: { kind: "DRIVER", targetId: driverUserId } } },
    ],
  };
}
