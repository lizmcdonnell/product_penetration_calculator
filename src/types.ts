export type SegmentKey = "casual" | "upscaleCasual" | "fineDining" | "bar" | "quickServe";
export type RegionKey = "belgium" | "canada" | "switzerland" | "germany" | "france" | "luxembourg" | "malta" | "netherlands" | "uk" | "us";

export type SegmentMix = Record<SegmentKey, number>; // 0..100
export type RegionMix = Record<RegionKey, SegmentMix>; // Segment mix per region

export type ComplexityLevel = "Low" | "Medium" | "High" | "Mandatory";

export type CompetitorsByRegion = {
  uk?: string[];
  germany?: string[];
  france?: string[];
  belgium?: string[];
};

export type Product = {
  id: string;
  category: string;
  name: string;
  notes?: string; // Optional notes field for additional product information
  // Per-segment product fit: expected % of that segment that will adopt the product
  fitBySegment: SegmentMix; // 0..100 per segment
  // Market dynamics
  percentWhoWantIt?: number; // 0..100, % who want the product
  percentWhoCanUseIt?: number; // 0..100, % who can realistically implement it
  complexity?: ComplexityLevel; // Low/Medium/High/Mandatory (Low=0.7, Medium=0.5, High=0.3, Mandatory=1.0 multiplier for penetration)
  currentAttachRate?: number; // 0..100, optional anchor - real observed attach % if known
  backbookMultiplier?: number; // 0..1, adjustable multiplier for penetration (existing customers)
  // Market relevance: countries where this product is relevant (empty = all countries)
  marketRelevance?: RegionKey[]; // Array of country codes where product is relevant
  // Competitors by region
  competitors?: CompetitorsByRegion;
};

export type AppState = {
  currentMix: RegionMix; // % makeup of existing customers by region (each region's mix must sum to 100)
  newMix: RegionMix;     // % makeup of net-new customers by region (each region's mix must sum to 100)
  products: Product[];
};

export const SEGMENT_LABELS: Record<SegmentKey, string> = {
  casual: "Casual",
  upscaleCasual: "Upscale Casual",
  fineDining: "Fine Dining",
  bar: "Bar",
  quickServe: "Quick Serve",
};

export const SEGMENT_KEYS: SegmentKey[] = ["casual", "upscaleCasual", "fineDining", "bar", "quickServe"];

export const REGION_LABELS: Record<RegionKey, string> = {
  belgium: "Belgium",
  canada: "Canada",
  switzerland: "Switzerland",
  germany: "Germany",
  france: "France",
  luxembourg: "Luxembourg",
  malta: "Malta",
  netherlands: "Netherlands",
  uk: "UK",
  us: "US",
};

export const REGION_KEYS: RegionKey[] = ["belgium", "canada", "switzerland", "germany", "france", "luxembourg", "malta", "netherlands", "uk", "us"];

export const DEFAULT_PRODUCTS: Omit<Product, "id">[] = [
  { category: "Online Ordering", name: "Order on my website", fitBySegment: { casual: 0, upscaleCasual: 0, fineDining: 0, bar: 0, quickServe: 0 } },
  { category: "Online Ordering", name: "Order via 3rd party integration", fitBySegment: { casual: 0, upscaleCasual: 0, fineDining: 0, bar: 0, quickServe: 0 } },
  { category: "In-Person Ordering", name: "Point-of-sale (stationary or mobile)", fitBySegment: { casual: 0, upscaleCasual: 0, fineDining: 0, bar: 0, quickServe: 0 } },
  { category: "In-Person Ordering", name: "Digital on-table ordering & payments", fitBySegment: { casual: 0, upscaleCasual: 0, fineDining: 0, bar: 0, quickServe: 0 } },
  { category: "In-Person Ordering", name: "Ordering kiosk", fitBySegment: { casual: 0, upscaleCasual: 0, fineDining: 0, bar: 0, quickServe: 0 } },
  { category: "Integrations", name: "Omniboost PMS Integration", fitBySegment: { casual: 0, upscaleCasual: 0, fineDining: 0, bar: 0, quickServe: 0 } },
  { category: "Integrations", name: "Direct API Access", fitBySegment: { casual: 0, upscaleCasual: 0, fineDining: 0, bar: 0, quickServe: 0 } },
  { category: "Integrations", name: "Accounting", fitBySegment: { casual: 0, upscaleCasual: 0, fineDining: 0, bar: 0, quickServe: 0 } },
  { category: "Consumer", name: "Loyalty", fitBySegment: { casual: 0, upscaleCasual: 0, fineDining: 0, bar: 0, quickServe: 0 } },
  { category: "Consumer", name: "Physical Gift Cards", fitBySegment: { casual: 0, upscaleCasual: 0, fineDining: 0, bar: 0, quickServe: 0 } },
  { category: "Consumer", name: "Digital Gift Cards", fitBySegment: { casual: 0, upscaleCasual: 0, fineDining: 0, bar: 0, quickServe: 0 } },
  { category: "Kitchen", name: "Inventory Management", fitBySegment: { casual: 0, upscaleCasual: 0, fineDining: 0, bar: 0, quickServe: 0 } },
  { category: "Kitchen", name: "KDS", fitBySegment: { casual: 0, upscaleCasual: 0, fineDining: 0, bar: 0, quickServe: 0 } },
];

export const DEFAULT_CURRENT_MIX: RegionMix = {
  belgium: { bar: 16, quickServe: 23, casual: 41, upscaleCasual: 19, fineDining: 1 }, // 16+23+41+19+1=100
  canada: { bar: 11, quickServe: 38, casual: 45, upscaleCasual: 4, fineDining: 2 }, // 11+38+45+4+2=100
  switzerland: { bar: 12, quickServe: 37, casual: 44, upscaleCasual: 3, fineDining: 4 }, // 12+37+44+3+4=100
  germany: { bar: 8, quickServe: 29, casual: 52, upscaleCasual: 10, fineDining: 1 }, // 8+29+52+10+1=100
  france: { bar: 15, quickServe: 22, casual: 48, upscaleCasual: 11, fineDining: 4 }, // 15+22+48+11+4=100
  luxembourg: { bar: 7, quickServe: 30, casual: 45, upscaleCasual: 14, fineDining: 4 }, // 7+30+45+14+4=100
  malta: { bar: 7, quickServe: 38, casual: 48, upscaleCasual: 6, fineDining: 1 }, // 7+38+48+6+1=100
  netherlands: { bar: 5, quickServe: 34, casual: 54, upscaleCasual: 6, fineDining: 1 }, // 5+34+54+6+1=100
  uk: { bar: 15, quickServe: 35, casual: 40, upscaleCasual: 9, fineDining: 1 }, // 15+35+40+9+1=100
  us: { bar: 18, quickServe: 39, casual: 37, upscaleCasual: 6, fineDining: 0 }, // 18+39+37+6+0=100
};

export const DEFAULT_NEW_MIX: RegionMix = {
  belgium: { bar: 16, quickServe: 23, casual: 41, upscaleCasual: 19, fineDining: 1 }, // Same as current mix
  canada: { bar: 11, quickServe: 38, casual: 45, upscaleCasual: 4, fineDining: 2 }, // Same as current mix
  switzerland: { bar: 12, quickServe: 37, casual: 44, upscaleCasual: 3, fineDining: 4 }, // Same as current mix
  germany: { bar: 8, quickServe: 29, casual: 52, upscaleCasual: 10, fineDining: 1 }, // Same as current mix
  france: { bar: 15, quickServe: 22, casual: 48, upscaleCasual: 11, fineDining: 4 }, // Same as current mix
  luxembourg: { bar: 7, quickServe: 30, casual: 45, upscaleCasual: 14, fineDining: 4 }, // Same as current mix
  malta: { bar: 7, quickServe: 38, casual: 48, upscaleCasual: 6, fineDining: 1 }, // Same as current mix
  netherlands: { bar: 5, quickServe: 34, casual: 54, upscaleCasual: 6, fineDining: 1 }, // Same as current mix
  uk: { bar: 15, quickServe: 35, casual: 40, upscaleCasual: 9, fineDining: 1 }, // Same as current mix
  us: { bar: 18, quickServe: 39, casual: 37, upscaleCasual: 6, fineDining: 0 }, // Same as current mix
};

