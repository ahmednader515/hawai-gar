/**
 * Truck/coverage fields are stored as JSON arrays of strings, e.g. `["سطحة","ستارة"]`,
 * so each value stays distinct for UI and matching. Legacy rows may be plain text or comma-separated.
 */

export function parseTagList(raw: string | null | undefined): string[] {
  const s = raw?.trim();
  if (!s) return [];
  if (s.startsWith("[")) {
    try {
      const p = JSON.parse(s) as unknown;
      if (Array.isArray(p)) {
        return p.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      /* legacy */
    }
  }
  if (s.includes("\n")) {
    return s.split("\n").map((x) => x.trim()).filter(Boolean);
  }
  return s.split(/[,،]/).map((x) => x.trim()).filter(Boolean);
}

export function serializeTagList(tags: string[]): string {
  const cleaned = tags.map((t) => t.trim()).filter(Boolean);
  return JSON.stringify(cleaned);
}

/** Single string for truck/destination matching (token search). */
export function catalogForMatching(raw: string | null | undefined): string {
  return parseTagList(raw).join(" ");
}

export function initialTruckTagsFromCarrier(row: {
  truckTypesCatalog: string | null;
  carType: string | null;
  carCapacity: string | null;
  carPlate: string | null;
}): string[] {
  const p = parseTagList(row.truckTypesCatalog ?? "");
  if (p.length) return p;
  const v = [row.carType, row.carCapacity, row.carPlate].filter(Boolean).join(" ").trim();
  return v ? [v] : [];
}

export function initialDestinationTagsFromCarrier(row: { serviceDestinations: string | null }): string[] {
  return parseTagList(row.serviceDestinations ?? "");
}
