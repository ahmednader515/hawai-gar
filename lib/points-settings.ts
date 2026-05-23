import { prisma } from "@/lib/db";

const KEY_CARRIER = "points_carrier_per_completion";
const KEY_COMPANY = "points_company_per_completion";

export type PointsSettings = {
  carrierPoints: number;
  companyPoints: number;
};

function parseNonNegativeInt(raw: string | undefined, fallback = 0): number {
  const n = parseInt(String(raw ?? "").trim(), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export async function getPointsSettings(): Promise<PointsSettings> {
  try {
    const [carrierRow, companyRow] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: KEY_CARRIER } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_COMPANY } }),
    ]);
    return {
      carrierPoints: parseNonNegativeInt(carrierRow?.value, 0),
      companyPoints: parseNonNegativeInt(companyRow?.value, 0),
    };
  } catch {
    return { carrierPoints: 0, companyPoints: 0 };
  }
}

export async function setPointsSettings(data: {
  carrierPoints?: number;
  companyPoints?: number;
}): Promise<PointsSettings> {
  if (data.carrierPoints !== undefined) {
    if (!Number.isFinite(data.carrierPoints) || data.carrierPoints < 0 || !Number.isInteger(data.carrierPoints)) {
      throw new Error("invalid_carrier_points");
    }
    await prisma.siteSetting.upsert({
      where: { key: KEY_CARRIER },
      create: { key: KEY_CARRIER, value: String(data.carrierPoints) },
      update: { value: String(data.carrierPoints) },
    });
  }
  if (data.companyPoints !== undefined) {
    if (!Number.isFinite(data.companyPoints) || data.companyPoints < 0 || !Number.isInteger(data.companyPoints)) {
      throw new Error("invalid_company_points");
    }
    await prisma.siteSetting.upsert({
      where: { key: KEY_COMPANY },
      create: { key: KEY_COMPANY, value: String(data.companyPoints) },
      update: { value: String(data.companyPoints) },
    });
  }
  return getPointsSettings();
}
