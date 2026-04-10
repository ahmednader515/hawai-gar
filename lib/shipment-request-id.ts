import { prisma } from "@/lib/db";

/** Serialize allocation across app instances (Postgres transaction-scoped lock). */
const SHIPMENT_REQUEST_SEQ_LOCK = 582_913_471;

const SEQ_KEY = "shipment_request_seq";

/** Human-readable ids: A001 … A999, then A1000, … */
export function formatShipmentRequestId(n: number): string {
  if (!Number.isFinite(n) || n < 1) {
    throw new Error("invalid shipment request sequence");
  }
  const width = n <= 999 ? 3 : String(n).length;
  return `A${String(n).padStart(width, "0")}`;
}

function parseStoredSeq(value: string | undefined): number {
  if (value == null || value === "") return 0;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Next id; safe under concurrent creates (same DB). */
export async function allocateShipmentRequestId(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT pg_advisory_xact_lock($1::bigint)`,
      SHIPMENT_REQUEST_SEQ_LOCK
    );

    const maxRows = await tx.$queryRaw<Array<{ max: bigint | null }>>`
      SELECT MAX(CAST(SUBSTRING("id", 2) AS INTEGER)) AS max
      FROM "ShipmentRequest"
      WHERE "id" ~ '^A[0-9]+$'
        AND LENGTH("id") > 1
    `;
    const maxFromDb = Number(maxRows[0]?.max ?? 0);

    const row = await tx.siteSetting.findUnique({ where: { key: SEQ_KEY } });
    const stored = parseStoredSeq(row?.value);
    const last = Math.max(stored, maxFromDb);
    const next = last + 1;

    await tx.siteSetting.upsert({
      where: { key: SEQ_KEY },
      create: { key: SEQ_KEY, value: String(next) },
      update: { value: String(next) },
    });

    return formatShipmentRequestId(next);
  });
}
