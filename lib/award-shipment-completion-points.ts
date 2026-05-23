import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPointsSettings } from "@/lib/points-settings";

type RecipientRole = "CARRIER" | "COMPANY";

async function tryAward(
  tx: Prisma.TransactionClient,
  shipmentRequestId: string,
  userId: string,
  recipientRole: RecipientRole,
  points: number,
): Promise<boolean> {
  try {
    await tx.pointsAward.create({
      data: {
        shipmentRequestId,
        userId,
        recipientRole,
        points,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { pointsBalance: { increment: points } },
    });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return false;
    }
    throw e;
  }
}

/** Awards configured points to carrier and company when a shipment is completed. Idempotent per recipient. */
export async function awardShipmentCompletionPoints(shipmentRequestId: string): Promise<void> {
  const [settings, request] = await Promise.all([
    getPointsSettings(),
    prisma.shipmentRequest.findUnique({
      where: { id: shipmentRequestId },
      select: { companyId: true, carrierId: true },
    }),
  ]);

  if (!request) return;

  const awards: { userId: string; role: RecipientRole; points: number }[] = [];

  if (request.carrierId && settings.carrierPoints > 0) {
    awards.push({
      userId: request.carrierId,
      role: "CARRIER",
      points: settings.carrierPoints,
    });
  }
  if (request.companyId && settings.companyPoints > 0) {
    awards.push({
      userId: request.companyId,
      role: "COMPANY",
      points: settings.companyPoints,
    });
  }

  if (awards.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const { userId, role, points } of awards) {
      await tryAward(tx, shipmentRequestId, userId, role, points);
    }
  });
}
