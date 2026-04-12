import { parseTagList } from "@/lib/catalog-tags";

export type CompanyRow = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  companyName: string | null;
  contactPerson: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  commercialRegister: string | null;
};

export type CarrierRow = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  fullName: string | null;
  phone: string | null;
  carPlate: string | null;
  carType: string | null;
  carCapacity: string | null;
  nationalId: string | null;
  licenseNumber: string | null;
  /** Same role as shipment_companies.company_name */
  listingCompanyName: string | null;
  representativeName: string | null;
  truckTypesCatalog: string | null;
  serviceDestinations: string | null;
};

export type ShipmentCompanyDirectoryRow = {
  id: string;
  company_name: string | null;
  representative_name: string | null;
  email: string | null;
  phone: string | null;
  truck_types: string | null;
  destinations: string | null;
  createdAt: string;
};

/** Display fields aligned with {@link ShipmentCompanyDirectoryRow} for platform carriers. */
export function carrierRowCompanyName(row: CarrierRow): string {
  return row.listingCompanyName?.trim() || row.fullName?.trim() || row.name?.trim() || "—";
}

export function carrierRowRepresentative(row: CarrierRow): string {
  return row.representativeName?.trim() || row.fullName?.trim() || row.name?.trim() || "—";
}

export function carrierRowTruckTypes(row: CarrierRow): string {
  const manual = row.truckTypesCatalog?.trim();
  if (manual) {
    const tags = parseTagList(manual);
    if (tags.length) return tags.join("، ");
  }
  const fromVehicle = [row.carType, row.carCapacity, row.carPlate].filter(Boolean).join(" ").trim();
  return fromVehicle || "—";
}

export function carrierRowDestinations(row: CarrierRow): string {
  const raw = row.serviceDestinations?.trim();
  if (!raw) return "—";
  const tags = parseTagList(raw);
  if (tags.length) return tags.join("، ");
  return raw;
}
