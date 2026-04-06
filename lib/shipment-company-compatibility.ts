type ShipmentRequestLike = {
  shipmentType: string | null;
  containerSize: string | null;
  containersCount?: string | null;
  fromText: string;
  toText: string;
  fromLat?: number | null;
  fromLng?: number | null;
  toLat?: number | null;
  toLng?: number | null;
  notes: string | null;
};

export type ShipmentCompanyLike = {
  id: string;
  company_name: string | null;
  representative_name: string | null;
  phone: string | null;
  email: string | null;
  truck_types: string | null;
  destinations: string | null;
};

export type ShipmentCompanyCompatibility = {
  company: ShipmentCompanyLike;
  score: number;
  matchedTruck: boolean;
  matchedDestination: boolean;
};

function norm(v: string | null | undefined): string {
  return (v ?? "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/[ة]/g, "ه")
    .replace(/[ى]/g, "ي")
    .replace(/ـ/g, "")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text: string, values: string[]): boolean {
  return values.some((value) => value && text.includes(value));
}

function isFiniteCoord(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isPointInSaudiArabia(lat: number, lng: number): boolean {
  // Practical bounding box for Saudi Arabia (sufficient for routing classification use-case).
  return lat >= 16.0 && lat <= 32.5 && lng >= 34.0 && lng <= 56.5;
}

function inferRequestDestinationType(request: ShipmentRequestLike): "local" | "international" {
  const { fromLat, fromLng, toLat, toLng } = request;
  const hasCoords =
    isFiniteCoord(fromLat) &&
    isFiniteCoord(fromLng) &&
    isFiniteCoord(toLat) &&
    isFiniteCoord(toLng);

  if (hasCoords) {
    const fromInSaudi = isPointInSaudiArabia(fromLat, fromLng);
    const toInSaudi = isPointInSaudiArabia(toLat, toLng);
    // If either side is outside Saudi bounds, treat as international.
    return fromInSaudi && toInSaudi ? "local" : "international";
  }

  const hay = norm(`${request.fromText} ${request.toText} ${request.notes ?? ""}`);
  const internationalHints = ["دولي", "الخليج", "عربية", "international", "global", "export", "import"];
  return containsAny(hay, internationalHints) ? "international" : "local";
}

function companySupportsDestination(destinations: string | null, destinationType: "local" | "international") {
  const hay = norm(destinations);
  if (!hay) return false;
  if (destinationType === "international") {
    return containsAny(hay, ["دولي", "international", "global", "الخليج"]);
  }
  return containsAny(hay, ["محلي", "local", "domestic"]);
}

type CanonicalTruckType =
  | "flatbed"
  | "curtain_side"
  | "reefer"
  | "freezer"
  | "tanker"
  | "lowbed"
  | "tipper"
  | "box_closed"
  | "sides"
  | "high_sides"
  | "pickup"
  | "crane";

// Canonical names reflect common regional logistics naming (flatbed/curtain/reefer/tanker/lowbed/tipper).
const TRUCK_CANONICAL_ALIASES: Record<CanonicalTruckType, string[]> = {
  flatbed: ["سطحه", "سطحة", "مقطوره مسطحه", "مقطورة مسطحة", "flatbed", "platform"],
  curtain_side: ["ستاره", "ستارة", "ستاريه", "مقطورة ستارية", "curtain", "tautliner"],
  reefer: ["ثلاجه مبرد", "ثلاجة مبرد", "مبرد", "مبرده", "مبردة", "reefer", "refrigerated"],
  freezer: ["ثلاجه مجمد", "ثلاجة مجمد", "مجمد", "تجميد", "freezer"],
  tanker: ["صهريج", "صهاريج", "tank", "tanker", "خزان"],
  lowbed: ["لوبد", "لوبيد", "lowbed", "low boy", "lowboy"],
  tipper: ["قلاب", "قلابه", "قلابة", "tipper", "dump"],
  box_closed: ["صندوق مغلق", "صندوق", "مقطوره مغلقه", "مقطورة مغلقة", "closed box", "box truck"],
  sides: ["جوانب", "drop side", "side wall"],
  high_sides: ["جوانب عاليه", "جوانب عالية", "high sides"],
  pickup: ["ونيت", "بكب", "بيك اب", "pick up", "pickup"],
  crane: ["كرين", "رافعه", "رافعة", "crane"],
};

const UI_REQUEST_TO_CANONICAL: Record<string, CanonicalTruckType[]> = {
  "تريلا": ["flatbed", "curtain_side", "reefer", "lowbed", "sides", "high_sides", "box_closed"],
  "سقس": ["sides", "reefer"],
  "لوري 7 متر": ["sides", "box_closed"],
  "لوري": ["sides", "box_closed", "reefer", "freezer", "crane"],
  "دينا": ["sides", "box_closed", "reefer", "freezer", "crane"],
  "ونيت": ["pickup"],
  "جوانب الماني": ["sides"],
  "ستارة": ["curtain_side"],
  "ثلاجة مبرد": ["reefer"],
  "سطحة": ["flatbed"],
  "جوانب عالية": ["high_sides"],
  "تجميد": ["freezer"],
  "سطحة ثلاث": ["flatbed"],
  "جوانب": ["sides"],
  "صندوق مغلق": ["box_closed"],
  "كرين 5 طن": ["crane"],
  "كرين 7 طن": ["crane"],
  "ثلاجة مجمد": ["freezer"],
  "كرين": ["crane"],
};

const UI_SIZE_ALIASES: Record<string, string[]> = {
  "تريلا": ["تريلا", "تريله", "تري", "مقطوره", "مقطورة", "نصف مقطورة", "semi trailer"],
  "سقس": ["سقس", "شاحنه سقس", "شاحنة سقس"],
  "لوري 7 متر": ["لوري 7 متر", "لوري 7", "7 متر", "7m", "lorry 7"],
  "لوري": ["لوري", "lorry", "truck"],
  "دينا": ["دينا", "دينه", "dyna"],
  "ونيت": ["ونيت", "بكب", "بيك اب", "pick up", "pickup"],
};

function canonicalTypesFromText(input: string): Set<CanonicalTruckType> {
  const hay = norm(input);
  const out = new Set<CanonicalTruckType>();
  if (!hay) return out;
  for (const [canonical, aliases] of Object.entries(TRUCK_CANONICAL_ALIASES) as Array<
    [CanonicalTruckType, string[]]
  >) {
    if (aliases.some((alias) => hay.includes(norm(alias)))) {
      out.add(canonical);
    }
  }
  return out;
}

function canonicalTypesFromRequest(request: ShipmentRequestLike): Set<CanonicalTruckType> {
  const out = new Set<CanonicalTruckType>();

  const directUiTerms = [
    norm(request.containerSize),
    norm(request.containersCount ?? ""),
  ].filter((v) => v.length >= 2);

  for (const term of directUiTerms) {
    const mapped = UI_REQUEST_TO_CANONICAL[term] ?? [];
    for (const canonical of mapped) out.add(canonical);
  }

  const textHints = [request.shipmentType, request.containerSize, request.containersCount ?? "", request.notes ?? ""]
    .map((v) => norm(v))
    .filter((v) => v.length >= 2)
    .join(" ");
  for (const canonical of canonicalTypesFromText(textHints)) out.add(canonical);

  return out;
}

function companySupportsTruck(companyTruckTypes: string | null, request: ShipmentRequestLike): boolean {
  const truckHay = norm(companyTruckTypes);
  if (!truckHay) return false;

  const requestSize = norm(request.containerSize);
  const requestType = norm(request.containersCount ?? "");
  const requestCanonical = canonicalTypesFromRequest(request);
  const companyCanonical = canonicalTypesFromText(truckHay);

  // If user selected a specific truck type, require canonical type compatibility.
  if (requestType) {
    const requiredTypeCanonicals = new Set<CanonicalTruckType>([
      ...(UI_REQUEST_TO_CANONICAL[requestType] ?? []),
      ...canonicalTypesFromText(requestType),
    ]);
    if (requiredTypeCanonicals.size > 0) {
      let hasTypeMatch = false;
      for (const canonical of requiredTypeCanonicals) {
        if (companyCanonical.has(canonical)) {
          hasTypeMatch = true;
          break;
        }
      }
      if (!hasTypeMatch) return false;
    }
  }

  // If user selected a truck size, require size-family compatibility.
  if (requestSize) {
    const sizeAliases = (UI_SIZE_ALIASES[requestSize] ?? [requestSize]).map((v) => norm(v));
    const hasSizeMatch = sizeAliases.some((alias) => alias && truckHay.includes(alias));
    if (!hasSizeMatch) return false;
  }

  // General canonical/fallback checks for free-text cases.
  for (const canonical of requestCanonical) {
    if (companyCanonical.has(canonical)) return true;
  }

  const fallbackHints = [
    norm(request.shipmentType),
    norm(request.containerSize),
    norm(request.containersCount ?? ""),
    ...norm(request.notes).split(/[,،/\-|]/g).map((x) => x.trim()),
  ].filter((x) => x.length >= 2);
  return fallbackHints.some((hint) => truckHay.includes(hint));
}

export function getCompatibleShipmentCompanies(
  request: ShipmentRequestLike,
  companies: ShipmentCompanyLike[],
): ShipmentCompanyCompatibility[] {
  const destinationType = inferRequestDestinationType(request);

  const scored = companies
    .map((company) => {
      const matchedTruck = companySupportsTruck(company.truck_types, request);
      const matchedDestination = companySupportsDestination(company.destinations, destinationType);
      const score = (matchedTruck ? 2 : 0) + (matchedDestination ? 1 : 0);
      return { company, score, matchedTruck, matchedDestination };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return norm(a.company.company_name).localeCompare(norm(b.company.company_name), "ar");
    });

  return scored;
}
