import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/server";
import {
  AdminClientsTabs,
  type CompanyRow,
  type CarrierRow,
  type ShipmentCompanyDirectoryRow,
} from "./admin-clients-tabs";

const PAGE_SIZE = 25;

function parsePositiveInt(raw: string | undefined, fallback = 1): number {
  const n = parseInt(String(raw ?? fallback), 10);
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

const activeCompanyWhere = { role: "COMPANY" as const, blacklistedAt: null };
const activeDriverWhere = { role: "DRIVER" as const, blacklistedAt: null };
const activeDirectoryWhere = { blacklistedAt: null };
const blacklistedCompanyWhere = { role: "COMPANY" as const, blacklistedAt: { not: null } as const };
const blacklistedDriverWhere = { role: "DRIVER" as const, blacklistedAt: { not: null } as const };
const blacklistedDirectoryWhere = { blacklistedAt: { not: null } as const };

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    dcPage?: string;
    coPage?: string;
    drPage?: string;
    bcoPage?: string;
    bdrPage?: string;
    bdcPage?: string;
  }>;
}) {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;

  const [
    companyTotal,
    driverTotal,
    directoryTotal,
    blacklistedCompanyTotal,
    blacklistedDriverTotal,
    blacklistedDirectoryTotal,
  ] = await Promise.all([
    prisma.user.count({ where: activeCompanyWhere }),
    prisma.user.count({ where: activeDriverWhere }),
    prisma.shipmentCompany.count({ where: activeDirectoryWhere }),
    prisma.user.count({ where: blacklistedCompanyWhere }),
    prisma.user.count({ where: blacklistedDriverWhere }),
    prisma.shipmentCompany.count({ where: blacklistedDirectoryWhere }),
  ]);

  const companyTotalPages = Math.max(1, Math.ceil(companyTotal / PAGE_SIZE));
  const driverTotalPages = Math.max(1, Math.ceil(driverTotal / PAGE_SIZE));
  const directoryTotalPages = Math.max(1, Math.ceil(directoryTotal / PAGE_SIZE));
  const blacklistedCompanyTotalPages = Math.max(1, Math.ceil(blacklistedCompanyTotal / PAGE_SIZE));
  const blacklistedDriverTotalPages = Math.max(1, Math.ceil(blacklistedDriverTotal / PAGE_SIZE));
  const blacklistedDirectoryTotalPages = Math.max(1, Math.ceil(blacklistedDirectoryTotal / PAGE_SIZE));

  let companyPage = parsePositiveInt(sp.coPage);
  if (companyPage > companyTotalPages) companyPage = companyTotalPages;

  let driverPage = parsePositiveInt(sp.drPage);
  if (driverPage > driverTotalPages) driverPage = driverTotalPages;

  let directoryPage = parsePositiveInt(sp.dcPage);
  if (directoryPage > directoryTotalPages) directoryPage = directoryTotalPages;

  let blacklistedCompanyPage = parsePositiveInt(sp.bcoPage);
  if (blacklistedCompanyPage > blacklistedCompanyTotalPages) {
    blacklistedCompanyPage = blacklistedCompanyTotalPages;
  }

  let blacklistedDriverPage = parsePositiveInt(sp.bdrPage);
  if (blacklistedDriverPage > blacklistedDriverTotalPages) {
    blacklistedDriverPage = blacklistedDriverTotalPages;
  }

  let blacklistedDirectoryPage = parsePositiveInt(sp.bdcPage);
  if (blacklistedDirectoryPage > blacklistedDirectoryTotalPages) {
    blacklistedDirectoryPage = blacklistedDirectoryTotalPages;
  }

  const companySelect = {
    id: true,
    email: true,
    name: true,
    createdAt: true,
    companyProfile: {
      select: {
        companyName: true,
        contactPerson: true,
        phone: true,
        city: true,
        address: true,
        commercialRegister: true,
      },
    },
  } as const;

  const driverSelect = {
    id: true,
    email: true,
    name: true,
    createdAt: true,
    driverProfile: {
      select: {
        fullName: true,
        phone: true,
        carPlate: true,
        carType: true,
        carCapacity: true,
        nationalId: true,
        licenseNumber: true,
        listingCompanyName: true,
        representativeName: true,
        truckTypesCatalog: true,
        serviceDestinations: true,
      },
    },
  } as const;

  const directorySelect = {
    id: true,
    company_name: true,
    representative_name: true,
    email: true,
    phone: true,
    truck_types: true,
    destinations: true,
    createdAt: true,
  } as const;

  const [
    companyUsers,
    driverUsers,
    shipmentCompanyDirectory,
    blacklistedCompanyUsers,
    blacklistedDriverUsers,
    blacklistedShipmentDirectory,
  ] = await Promise.all([
    prisma.user.findMany({
      where: activeCompanyWhere,
      skip: (companyPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: companySelect,
    }),
    prisma.user.findMany({
      where: activeDriverWhere,
      skip: (driverPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "asc" },
      select: driverSelect,
    }),
    prisma.shipmentCompany.findMany({
      where: activeDirectoryWhere,
      skip: (directoryPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { company_name: "asc" },
      select: directorySelect,
    }),
    prisma.user.findMany({
      where: blacklistedCompanyWhere,
      skip: (blacklistedCompanyPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { blacklistedAt: "desc" },
      select: companySelect,
    }),
    prisma.user.findMany({
      where: blacklistedDriverWhere,
      skip: (blacklistedDriverPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { blacklistedAt: "desc" },
      select: driverSelect,
    }),
    prisma.shipmentCompany.findMany({
      where: blacklistedDirectoryWhere,
      skip: (blacklistedDirectoryPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { blacklistedAt: "desc" },
      select: directorySelect,
    }),
  ]);

  const mapCompany = (u: (typeof companyUsers)[0]): CompanyRow => ({
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.createdAt.toISOString(),
    companyName: u.companyProfile?.companyName ?? null,
    contactPerson: u.companyProfile?.contactPerson ?? null,
    phone: u.companyProfile?.phone ?? null,
    city: u.companyProfile?.city ?? null,
    address: u.companyProfile?.address ?? null,
    commercialRegister: u.companyProfile?.commercialRegister ?? null,
  });

  const mapDriver = (u: (typeof driverUsers)[0]): CarrierRow => ({
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.createdAt.toISOString(),
    fullName: u.driverProfile?.fullName ?? null,
    phone: u.driverProfile?.phone ?? null,
    carPlate: u.driverProfile?.carPlate ?? null,
    carType: u.driverProfile?.carType ?? null,
    carCapacity: u.driverProfile?.carCapacity ?? null,
    nationalId: u.driverProfile?.nationalId ?? null,
    licenseNumber: u.driverProfile?.licenseNumber ?? null,
    listingCompanyName: u.driverProfile?.listingCompanyName ?? null,
    representativeName: u.driverProfile?.representativeName ?? null,
    truckTypesCatalog: u.driverProfile?.truckTypesCatalog ?? null,
    serviceDestinations: u.driverProfile?.serviceDestinations ?? null,
  });

  const mapDirectory = (row: (typeof shipmentCompanyDirectory)[0]): ShipmentCompanyDirectoryRow => ({
    id: row.id,
    company_name: row.company_name,
    representative_name: row.representative_name,
    email: row.email,
    phone: row.phone,
    truck_types: row.truck_types,
    destinations: row.destinations,
    createdAt: row.createdAt.toISOString(),
  });

  const companies: CompanyRow[] = companyUsers.map(mapCompany);
  const registeredCarriers: CarrierRow[] = driverUsers.map(mapDriver);
  const directoryCarriers: ShipmentCompanyDirectoryRow[] = shipmentCompanyDirectory.map(mapDirectory);

  const blacklistedCompanies: CompanyRow[] = blacklistedCompanyUsers.map(mapCompany);
  const blacklistedCarriers: CarrierRow[] = blacklistedDriverUsers.map(mapDriver);
  const blacklistedDirectoryCarriers: ShipmentCompanyDirectoryRow[] =
    blacklistedShipmentDirectory.map(mapDirectory);

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.admin.clientsTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("dashboard.admin.clientsSubtitle")}</p>
      </div>
      <AdminClientsTabs
        companies={companies}
        registeredCarriers={registeredCarriers}
        directoryCarriers={directoryCarriers}
        blacklistedCompanies={blacklistedCompanies}
        blacklistedCarriers={blacklistedCarriers}
        blacklistedDirectoryCarriers={blacklistedDirectoryCarriers}
        companyPage={companyPage}
        companyTotal={companyTotal}
        companyTotalPages={companyTotalPages}
        driverPage={driverPage}
        driverTotal={driverTotal}
        driverTotalPages={driverTotalPages}
        directoryPage={directoryPage}
        directoryTotal={directoryTotal}
        directoryTotalPages={directoryTotalPages}
        blacklistedCompanyPage={blacklistedCompanyPage}
        blacklistedCompanyTotal={blacklistedCompanyTotal}
        blacklistedCompanyTotalPages={blacklistedCompanyTotalPages}
        blacklistedDriverPage={blacklistedDriverPage}
        blacklistedDriverTotal={blacklistedDriverTotal}
        blacklistedDriverTotalPages={blacklistedDriverTotalPages}
        blacklistedDirectoryPage={blacklistedDirectoryPage}
        blacklistedDirectoryTotal={blacklistedDirectoryTotal}
        blacklistedDirectoryTotalPages={blacklistedDirectoryTotalPages}
        pageSize={PAGE_SIZE}
        currentUserId={session.user.id!}
      />
    </div>
  );
}
