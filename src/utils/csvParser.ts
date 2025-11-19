import type { RegionKey, SegmentKey, RegionMix } from '../types';
import { normalizeSegmentMix } from './calculations';

// Map CSV cohort names to SegmentKey
const COHORT_TO_SEGMENT: Record<string, SegmentKey> = {
  bar: 'bar',
  fast_casual: 'quickServe',
  casual: 'casual',
  upscale: 'upscaleCasual',
  fine_dining: 'fineDining',
};

// Map CSV country names to RegionKey
const COUNTRY_TO_REGION: Record<string, RegionKey> = {
  'Belgium': 'belgium',
  'Canada': 'canada',
  'Switzerland': 'switzerland',
  'Germany': 'germany',
  'France': 'france',
  'Luxembourg': 'luxembourg',
  'Malta': 'malta',
  'Netherlands': 'netherlands',
  'United Kingdom': 'uk',
  'United States': 'us',
};

export interface CSVRow {
  country: string;
  cohort: string;
  totalLocations: number;
  percentage: number;
}

export interface ParsedCSVData {
  regionMix: RegionMix;
  countryTotals: Record<RegionKey, number>; // Total locations per country
  totalLocations: number; // Total locations across all countries
  countryPercentages: Record<RegionKey, number>; // % of total base each country represents
  uploadTimestamp?: number; // Timestamp when CSV was uploaded (added by component)
}

export function parseCSV(csvText: string): ParsedCSVData {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  // Skip header row
  const dataLines = lines.slice(1);
  
  const rows: CSVRow[] = [];
  let currentCountry = '';

  // Parse rows, handling multi-line values (quoted numbers with commas)
  for (const line of dataLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Parse CSV line handling quoted fields
    const parts: string[] = [];
    let currentPart = '';
    let inQuotes = false;
    
    for (let i = 0; i <= trimmed.length; i++) {
      const char = trimmed[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(currentPart.trim());
        currentPart = '';
      } else if (i === trimmed.length) {
        currentPart += char || '';
        parts.push(currentPart.trim());
      } else {
        currentPart += char || '';
      }
    }

    if (parts.length < 4) continue; // Need at least: Country, Cohort, Total Locations, Percentage

    // Check if this line starts with a country name (has value in first column)
    const firstCol = parts[0].trim();
    
    if (firstCol && COUNTRY_TO_REGION[firstCol]) {
      currentCountry = firstCol;
    }

    // Skip if no country set
    if (!currentCountry) continue;

    const cohort = parts[1].trim().toLowerCase();
    if (!COHORT_TO_SEGMENT[cohort]) continue;

    // Parse total locations (remove quotes and commas)
    const totalLocationsStr = parts[2].replace(/["',]/g, '');
    const totalLocations = parseInt(totalLocationsStr, 10);
    if (isNaN(totalLocations)) continue;

    // Parse percentage (remove % sign)
    const percentageStr = parts[3].replace('%', '').trim();
    const percentage = parseFloat(percentageStr);
    if (isNaN(percentage)) continue;

    rows.push({
      country: currentCountry,
      cohort,
      totalLocations,
      percentage,
    });
  }

  // Group by country and segment
  const countryTotals: Record<RegionKey, number> = {} as Record<RegionKey, number>;
  const regionMix: RegionMix = {} as RegionMix;

  // Initialize regionMix for all regions
  const regionKeys: RegionKey[] = ['belgium', 'canada', 'switzerland', 'germany', 'france', 'luxembourg', 'malta', 'netherlands', 'uk', 'us'];
  for (const region of regionKeys) {
    regionMix[region] = {
      bar: 0,
      quickServe: 0,
      casual: 0,
      upscaleCasual: 0,
      fineDining: 0,
    };
    countryTotals[region] = 0;
  }

  // Process rows
  for (const row of rows) {
    const region = COUNTRY_TO_REGION[row.country];
    if (!region) continue;

    const segment = COHORT_TO_SEGMENT[row.cohort];
    if (!segment) continue;

    // Use percentage from CSV (rounded to nearest whole number)
    regionMix[region][segment] = Math.round(row.percentage);
    
    // Accumulate total locations per country
    countryTotals[region] += row.totalLocations;
  }

  // Normalize each country's segment mix to sum to exactly 100%
  for (const region of regionKeys) {
    regionMix[region] = normalizeSegmentMix(regionMix[region]);
  }

  // Calculate total locations across all countries
  const totalLocations = Object.values(countryTotals).reduce((sum, total) => sum + total, 0);

  // Calculate % of total base each country represents
  const countryPercentages: Record<RegionKey, number> = {} as Record<RegionKey, number>;
  for (const region of regionKeys) {
    countryPercentages[region] = totalLocations > 0 
      ? (countryTotals[region] / totalLocations) * 100 
      : 0;
  }

  return {
    regionMix,
    countryTotals,
    totalLocations,
    countryPercentages,
  };
}

