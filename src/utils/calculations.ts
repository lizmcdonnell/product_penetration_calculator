import type { SegmentKey, SegmentMix, Product, RegionMix, ComplexityLevel, RegionKey } from "../types";
import { REGION_LABELS, REGION_KEYS } from "../types";

const toFrac = (v: number) => Math.max(0, Math.min(100, v)) / 100;

// Map RegionKey to ISO country codes
const REGION_TO_CODE: Record<RegionKey, string> = {
  belgium: "BE",
  canada: "CA",
  switzerland: "CH",
  germany: "DE",
  france: "FR",
  luxembourg: "LU",
  malta: "MT",
  netherlands: "NL",
  uk: "GB",
  us: "US",
};

// Convert SegmentMix to algorithm Mix format
function toAlgorithmMix(mix: SegmentMix): Record<"casual" | "upscale" | "fine" | "bar" | "qsr", number> {
  return {
    casual: mix.casual,
    upscale: mix.upscaleCasual,
    fine: mix.fineDining,
    bar: mix.bar,
    qsr: mix.quickServe,
  };
}

export function validateMix(mix: SegmentMix) {
  const total = Object.values(mix).reduce((a, b) => a + b, 0);
  return { total, isValid: Math.abs(total - 100) < 0.1 };
}

// Aggregate region mix into a single segment mix (weighted average across regions)
function aggregateRegionMix(
  regionMix: RegionMix,
  countryTotals?: Record<string, number>
): SegmentMix {
  // If country totals are provided, use weighted average based on locations
  if (countryTotals) {
    const totalLocations = Object.values(countryTotals).reduce((sum, total) => sum + total, 0);
    if (totalLocations > 0) {
      return computeWeightedSegmentMix(regionMix, countryTotals, totalLocations);
    }
  }

  // Otherwise, use simple average across all regions
  const regionCount = Object.keys(regionMix).length;
  const aggregated: SegmentMix = {
    casual: 0,
    upscaleCasual: 0,
    fineDining: 0,
    bar: 0,
    quickServe: 0,
  };

  // Simple average across all regions (assuming equal weighting)
  Object.values(regionMix).forEach((mix) => {
    Object.keys(mix).forEach((segment) => {
      aggregated[segment as SegmentKey] += mix[segment as SegmentKey];
    });
  });

  // Average across regions
  Object.keys(aggregated).forEach((segment) => {
    aggregated[segment as SegmentKey] /= regionCount;
  });

  return aggregated;
}

// Calculate weighted fit from segment mix
// weightedFit = (segmentFit.casual * mix.casual + ...) / 100
function computeWeightedFit(product: Product, customerMix: SegmentMix): number {
  return (Object.keys(customerMix) as SegmentKey[]).reduce((acc, seg) => {
    return acc + toFrac(customerMix[seg]) * toFrac(product.fitBySegment[seg]);
  }, 0) * 100; // 0-100 scale
}


// Get complexity multiplier for penetration: Low=0.7, Medium=0.5, High=0.3, Mandatory=1.0
function getComplexityMultiplier(complexity?: ComplexityLevel): number {
  switch (complexity) {
    case 'Low': return 0.7;
    case 'Medium': return 0.5;
    case 'High': return 0.3;
    case 'Mandatory': return 1.0;
    default: return 1.0; // Default to 1.0 if not set
  }
}

// Backbook multipliers now default to 1.0 for all products unless explicitly set
// (Category-based defaults removed - products now default to no backbook friction)

// Complexity multiplier for penetration: Low=0.7, Medium=0.5, High=0.3, Mandatory=1.0
function complexityMul(complexity: ComplexityLevel | undefined): number {
  if (complexity === "Low") return 0.7;
  if (complexity === "Medium") return 0.5;
  if (complexity === "High") return 0.3;
  if (complexity === "Mandatory") return 1.0;
  return 1.0; // Default to 1.0 if not set
}

// Weighted fit: (segmentFit.casual * mix.casual + ...) / 100
function weightedFit(
  segmentFit: Record<"casual" | "upscale" | "fine" | "bar" | "qsr", number>,
  mix: Record<"casual" | "upscale" | "fine" | "bar" | "qsr", number>
): number {
  return (
    (segmentFit.casual * mix.casual +
     segmentFit.upscale * mix.upscale +
     segmentFit.fine * mix.fine +
     segmentFit.bar * mix.bar +
     segmentFit.qsr * mix.qsr) / 100
  );
}

// Country row interface for the algorithm
interface CountryRow {
  code: string;
  label: string;
  baseShare: number;     // % of total EXISTING locations (0-100)
  newShare: number;       // % of total NET-NEW locations (0-100)
  currentMix: Record<"casual" | "upscale" | "fine" | "bar" | "qsr", number>;
  newMix: Record<"casual" | "upscale" | "fine" | "bar" | "qsr", number>;
}

// Build CountryRow[] from current data structure
function buildCountryRows(
  currentMix: RegionMix,
  newMix: RegionMix,
  countryTotals: Record<RegionKey, number>
): CountryRow[] {
  const totalBase = Object.values(countryTotals).reduce((sum, total) => sum + total, 0);
  const totalNew = totalBase; // Assume same total for now (net-new = existing base size)
  
  return REGION_KEYS.map((region): CountryRow => {
    const countryTotal = countryTotals[region] || 0;
    const baseShare = totalBase > 0 ? (countryTotal / totalBase) * 100 : 0;
    const newShare = totalNew > 0 ? (countryTotal / totalNew) * 100 : 0;
    
    return {
      code: REGION_TO_CODE[region],
      label: REGION_LABELS[region],
      baseShare,
      newShare,
      currentMix: toAlgorithmMix(currentMix[region] || {
        casual: 0,
        upscaleCasual: 0,
        fineDining: 0,
        bar: 0,
        quickServe: 0,
      }),
      newMix: toAlgorithmMix(newMix[region] || {
        casual: 0,
        upscaleCasual: 0,
        fineDining: 0,
        bar: 0,
        quickServe: 0,
      }),
    };
  });
}

// Main algorithm function
function predictAttachAndPenetrationByProduct(
  product: {
    segmentFit: Record<"casual" | "upscale" | "fine" | "bar" | "qsr", number>;
    complexity: ComplexityLevel | undefined;
    currentAttachRate?: number;
    backbookMultiplier?: number;
    marketCountries: "ALL" | string[];
  },
  countries: CountryRow[]
): { attachPct: number; penetrationPct: number; coverage: { new: number; base: number } } {
  // 1) Determine relevant countries
  const selected = product.marketCountries === "ALL"
    ? countries
    : countries.filter(c => (product.marketCountries as string[]).includes(c.code));

  if (selected.length === 0) {
    return { attachPct: 0, penetrationPct: 0, coverage: { new: 0, base: 0 } };
  }

  // 2) Resolve backbook factor + complexity
  // backbookMultiplier defaults to 1.0 if not explicitly set
  const backbook = product.backbookMultiplier ?? 1.0;
  const comp = complexityMul(product.complexity);

  // 3) Normalize country weights for proper averaging
  const totalNew = selected.reduce((s, c) => s + c.newShare, 0) || 1;
  const totalBase = selected.reduce((s, c) => s + c.baseShare, 0) || 1;

  // 4) Per-country compute, then weight by market share
  let attachSum = 0;
  let penSum = 0;

  for (const c of selected) {
    const fitNewPct = weightedFit(product.segmentFit, c.newMix);     // %
    const fitBasePct = weightedFit(product.segmentFit, c.currentMix); // %

    // ATTACH (new): anchor if given, else use fit on new mix
    const attachCountryPct =
      (product.currentAttachRate ?? 0) > 0
        ? product.currentAttachRate! * 1.10     // mild forward bias on known attach
        : fitNewPct;                             // attach potential driven by fit

    // PENETRATION (sell-into base): anchor if given, else fit on current mix, then friction
    const penetrationCountryPct =
      (product.currentAttachRate ?? 0) > 0
        ? product.currentAttachRate! * backbook * comp
        : fitBasePct * backbook * comp;

    // Weight by country share (net-new for attach; existing base for penetration)
    // This gives us the attach/penetration rate WITHIN the selected countries
    attachSum += attachCountryPct * (c.newShare / totalNew);
    penSum += penetrationCountryPct * (c.baseShare / totalBase);
  }

  // Calculate coverage: what % of the full base do selected countries represent?
  const coverage = {
    new: selected.reduce((s, c) => s + c.newShare, 0),   // % of net-new covered
    base: selected.reduce((s, c) => s + c.baseShare, 0)   // % of existing base covered
  };

  // Adjust attach/penetration to be relative to the FULL base, not just selected countries
  // If a product is only relevant to 19.37% of the base, its attach/penetration should reflect that
  const attachPct = Math.max(0, Math.min(100, attachSum * (coverage.new / 100)));
  const penetrationPct = Math.max(0, Math.min(100, penSum * (coverage.base / 100)));

  return { attachPct, penetrationPct, coverage };
}

// Get backbook multiplier for a product (uses product's value or 1.0 as default)
function getBackbookMultiplier(product: Product): number {
  // If explicitly set on product, use it
  if (product.backbookMultiplier !== undefined) {
    return product.backbookMultiplier;
  }
  // Otherwise use 1.0 as default (no backbook friction unless explicitly set)
  return 1.0;
}

// Predicted Penetration (for existing customers) = sell-into potential
// Uses the new algorithm that weights by country market share
export function computePenetration(
  product: Product,
  currentMix: RegionMix,
  countryTotals?: Record<string, number>,
  newMix?: RegionMix // Optional: needed for full algorithm, but can use currentMix as fallback
) {
  // If country totals are not available, fall back to old method
  if (!countryTotals || Object.keys(countryTotals).length === 0) {
    const weightedFit = computeWeightedFit(product, aggregateRegionMix(currentMix));
    const backbookFactor = getBackbookMultiplier(product);
    const complexityMultiplier = getComplexityMultiplier(product.complexity);
    
    if (product.currentAttachRate !== undefined && product.currentAttachRate > 0) {
      return product.currentAttachRate * backbookFactor * complexityMultiplier;
    }
    
    return weightedFit * backbookFactor * complexityMultiplier;
  }

  // Use new algorithm - need both currentMix and newMix for country rows
  // For penetration, we use currentMix for base, and newMix (or currentMix if not provided) for new
  const countries = buildCountryRows(currentMix, newMix || currentMix, countryTotals);
  const segmentFit = toAlgorithmMix(product.fitBySegment);
  
  // Convert marketRelevance to algorithm format
  const marketCountries: "ALL" | string[] = 
    !product.marketRelevance || product.marketRelevance.length === 0
      ? "ALL"
      : product.marketRelevance.map(r => REGION_TO_CODE[r]);

  const result = predictAttachAndPenetrationByProduct(
    {
      segmentFit,
      complexity: product.complexity,
      currentAttachRate: product.currentAttachRate,
      backbookMultiplier: product.backbookMultiplier ?? 1.0,
      marketCountries,
    },
    countries
  );

  return result.penetrationPct;
}

// Predicted Attach (for net-new customers) = sell-into potential
// Uses the new algorithm that weights by country market share
export function computeAttach(
  product: Product,
  newMix: RegionMix,
  countryTotals?: Record<string, number>,
  currentMix?: RegionMix // Optional: needed for full algorithm, but can use newMix as fallback
) {
  // If country totals are not available, fall back to old method
  if (!countryTotals || Object.keys(countryTotals).length === 0) {
    const weightedFit = computeWeightedFit(product, aggregateRegionMix(newMix));
    
    if (product.currentAttachRate !== undefined && product.currentAttachRate > 0) {
      return product.currentAttachRate * 1.1;
    }
    
    return weightedFit;
  }

  // Use new algorithm - need both currentMix and newMix for country rows
  // For attach, we use newMix for new, and currentMix (or newMix if not provided) for base
  const countries = buildCountryRows(currentMix || newMix, newMix, countryTotals);
  const segmentFit = toAlgorithmMix(product.fitBySegment);
  
  // Convert marketRelevance to algorithm format
  const marketCountries: "ALL" | string[] = 
    !product.marketRelevance || product.marketRelevance.length === 0
      ? "ALL"
      : product.marketRelevance.map(r => REGION_TO_CODE[r]);

  const result = predictAttachAndPenetrationByProduct(
    {
      segmentFit,
      complexity: product.complexity,
      currentAttachRate: product.currentAttachRate,
      backbookMultiplier: product.backbookMultiplier ?? 1.0,
      marketCountries,
    },
    countries
  );

  return result.attachPct;
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

// Normalize segment mix to sum to exactly 100% after rounding to whole numbers
export function normalizeSegmentMix(mix: SegmentMix): SegmentMix {
  // Round all values to nearest whole number
  const rounded: SegmentMix = {
    casual: Math.round(mix.casual),
    upscaleCasual: Math.round(mix.upscaleCasual),
    fineDining: Math.round(mix.fineDining),
    bar: Math.round(mix.bar),
    quickServe: Math.round(mix.quickServe),
  };
  
  // Calculate total
  const total = Object.values(rounded).reduce((sum, val) => sum + val, 0);
  
  // Adjust to sum to exactly 100
  const diff = 100 - total;
  if (diff !== 0) {
    // Find the segment with the largest value and adjust it
    const segments = Object.keys(rounded) as SegmentKey[];
    let largestSegment = segments[0];
    let largestValue = rounded[largestSegment];
    
    for (const segment of segments) {
      if (rounded[segment] > largestValue) {
        largestValue = rounded[segment];
        largestSegment = segment;
      }
    }
    
    // Adjust the largest segment to make total = 100
    rounded[largestSegment] = Math.max(0, Math.min(100, rounded[largestSegment] + diff));
  }
  
  return rounded;
}

// Calculate weighted average segment mix across all regions, weighted by country total locations
export function computeWeightedSegmentMix(
  regionMix: RegionMix,
  countryTotals: Record<string, number>,
  totalLocations: number
): SegmentMix {
  const weighted: SegmentMix = {
    casual: 0,
    upscaleCasual: 0,
    fineDining: 0,
    bar: 0,
    quickServe: 0,
  };
  
  if (totalLocations === 0) return weighted;
  
  // Calculate weighted average: sum(countryTotal * segmentPercentage) / totalLocations
  Object.keys(regionMix).forEach((region) => {
    const countryTotal = countryTotals[region] || 0;
    const mix = regionMix[region as keyof typeof regionMix];
    
    if (mix) {
      Object.keys(weighted).forEach((segment) => {
        weighted[segment as SegmentKey] += (countryTotal * mix[segment as SegmentKey]) / totalLocations;
      });
    }
  });
  
  // Normalize to sum to exactly 100% (rounded to whole numbers)
  return normalizeSegmentMix(weighted);
}

