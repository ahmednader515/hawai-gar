import "dotenv/config";
import path from "node:path";
import { promises as fs } from "node:fs";
import { prisma } from "../lib/db";

const INPUT_JSON = path.join(process.cwd(), "data.json");
const INSERT_BATCH_SIZE = 500;

type InputShipmentCompany = {
  phone?: string | null;
  email?: string | null;
  representative_name?: string | null;
  destinations?: string | null;
  truck_types?: string | null;
  company_name?: string | null;
};

function sanitizeNullable(value: string | null | undefined): string | null {
  if (value == null) return null;
  const cleaned = String(value).replace(/\u0000/g, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

async function run() {
  const content = await fs.readFile(INPUT_JSON, "utf8");
  const rows = JSON.parse(content) as InputShipmentCompany[];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`No rows found in JSON file: ${INPUT_JSON}`);
  }

  await prisma.shipmentCompany.deleteMany({});

  let inserted = 0;
  for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + INSERT_BATCH_SIZE);
    await prisma.shipmentCompany.createMany({
      data: batch.map((row) => ({
        phone: sanitizeNullable(row.phone),
        email: sanitizeNullable(row.email),
        representative_name: sanitizeNullable(row.representative_name),
        destinations: sanitizeNullable(row.destinations),
        truck_types: sanitizeNullable(row.truck_types),
        company_name: sanitizeNullable(row.company_name),
      })),
    });
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${rows.length} rows`);
  }

  const finalCount = await prisma.shipmentCompany.count();
  console.log(`Import complete. Inserted ${inserted} rows. Table count is now ${finalCount}.`);
}

run()
  .catch((error) => {
    console.error("Shipment companies import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
