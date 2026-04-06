import "dotenv/config";
import { prisma } from "../lib/db";

async function run() {
  const beforeCount = await prisma.shipmentCompany.count();
  const result = await prisma.shipmentCompany.deleteMany({});
  const afterCount = await prisma.shipmentCompany.count();

  console.log(`Deleted ${result.count} shipment companies.`);
  console.log(`Count before: ${beforeCount}`);
  console.log(`Count after: ${afterCount}`);
}

run()
  .catch((error) => {
    console.error("Failed to clear shipment companies:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
