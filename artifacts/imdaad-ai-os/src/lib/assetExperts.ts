export interface AssetExpert {
  key: string;
  name: string;
  specialty: string;
  iconName: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  greeting: string;
}

export const ASSET_EXPERTS: Record<string, AssetExpert> = {
  hvac: {
    key: "hvac",
    name: "HVAC Expert",
    specialty: "Cooling, Ventilation & Air Handling",
    iconName: "Wind",
    accentColor: "#2E7FFF",
    accentBg: "rgba(46,127,255,0.12)",
    accentBorder: "rgba(46,127,255,0.3)",
    greeting: "HVAC Expert online. I have context on this asset and checklist. Ask me anything about the system — pressures, temperatures, filter specs, or fault diagnosis.",
  },
  chiller: {
    key: "chiller",
    name: "Chiller Expert",
    specialty: "Water-Cooled & Air-Cooled Chillers",
    iconName: "Thermometer",
    accentColor: "#06B6D4",
    accentBg: "rgba(6,182,212,0.12)",
    accentBorder: "rgba(6,182,212,0.3)",
    greeting: "Chiller Expert online. I can help with refrigerant circuits, evaporator/condenser fouling, compressor faults, COP calculations, and load-balancing. What do you need?",
  },
  lift: {
    key: "lift",
    name: "Lift Expert",
    specialty: "Passenger & Service Lifts",
    iconName: "ArrowUpDown",
    accentColor: "#A78BFA",
    accentBg: "rgba(167,139,250,0.12)",
    accentBorder: "rgba(167,139,250,0.3)",
    greeting: "Lift Expert online. I can guide you through safety checks, door mechanism testing, drive diagnostics, and DCD compliance. What's the current step?",
  },
  fire_safety: {
    key: "fire_safety",
    name: "Fire Safety Expert",
    specialty: "Suppression, Detection & Life Safety",
    iconName: "Flame",
    accentColor: "#EF4444",
    accentBg: "rgba(239,68,68,0.12)",
    accentBorder: "rgba(239,68,68,0.3)",
    greeting: "Fire Safety Expert online. I can assist with panel testing, sprinkler inspection, suppression system checks, and DCD compliance. Safety is the priority — let's proceed carefully.",
  },
  plumbing: {
    key: "plumbing",
    name: "Plumbing Expert",
    specialty: "Leak Detection, Pumps & Water Systems",
    iconName: "Droplets",
    accentColor: "#22D3EE",
    accentBg: "rgba(34,211,238,0.12)",
    accentBorder: "rgba(34,211,238,0.3)",
    greeting: "Plumbing Expert online. I can help with pump inspections, pressure testing, leak detection, and drainage checks. What's the current inspection step?",
  },
  electrical: {
    key: "electrical",
    name: "Electrical Expert",
    specialty: "Panels, Breakers, Cabling & Distribution",
    iconName: "Zap",
    accentColor: "#F59E0B",
    accentBg: "rgba(245,158,11,0.12)",
    accentBorder: "rgba(245,158,11,0.3)",
    greeting: "Electrical Expert online. I can guide panel inspections, thermal scanning, load measurements, and DEWA compliance. Always verify isolation before any work — what's the task?",
  },
  generator: {
    key: "generator",
    name: "Generator Expert",
    specialty: "Standby Power & Load Testing",
    iconName: "Battery",
    accentColor: "#10B981",
    accentBg: "rgba(16,185,129,0.12)",
    accentBorder: "rgba(16,185,129,0.3)",
    greeting: "Generator Expert online. I can help with load testing procedures, fuel system checks, ATS/AMF panel testing, and exhaust inspection. Ready when you are.",
  },
};

export function resolveExpert(
  assetType: string,
  assetSubtype?: string,
  assetName?: string,
): AssetExpert {
  const typeKey = (assetType ?? "").toLowerCase();
  const subtypeKey = (assetSubtype ?? "").toLowerCase();
  const nameKey = (assetName ?? "").toLowerCase();

  if (subtypeKey.includes("chiller") || nameKey.includes("chiller")) {
    return ASSET_EXPERTS.chiller;
  }
  if (nameKey.includes("generator") || nameKey.startsWith("gen") || nameKey.includes(" g-0")) {
    return ASSET_EXPERTS.generator;
  }

  if (typeKey.includes("hvac")) return ASSET_EXPERTS.hvac;
  if (typeKey.includes("chiller")) return ASSET_EXPERTS.chiller;
  if (typeKey.includes("lift") || typeKey.includes("elevator") || typeKey.includes("vertical")) return ASSET_EXPERTS.lift;
  if (typeKey.includes("fire") || typeKey.includes("safety") || typeKey.includes("suppression")) return ASSET_EXPERTS.fire_safety;
  if (typeKey.includes("plumbing") || typeKey.includes("water") || typeKey.includes("drainage")) return ASSET_EXPERTS.plumbing;
  if (typeKey.includes("electrical") || typeKey.includes("power")) return ASSET_EXPERTS.electrical;
  if (typeKey.includes("generator")) return ASSET_EXPERTS.generator;

  return ASSET_EXPERTS.hvac;
}
