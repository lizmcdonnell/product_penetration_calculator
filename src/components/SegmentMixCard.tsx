import React, { useState, useRef, useEffect } from "react";
import { PercentInput } from "./PercentInput";
import { TotalBadge } from "./TotalBadge";
import { validateMix, clampPercent, computeWeightedSegmentMix } from "../utils/calculations";
import { parseCSV, type ParsedCSVData } from "../utils/csvParser";
import type { RegionMix, SegmentKey, RegionKey } from "../types";
import { SEGMENT_LABELS, SEGMENT_KEYS, REGION_LABELS, REGION_KEYS } from "../types";

interface SegmentMixCardProps {
  title: string;
  mix: RegionMix;
  onChange: (region: RegionKey, segment: SegmentKey, value: number) => void;
  onBalance?: (region: RegionKey) => void;
  locked?: boolean;
  onToggleLock?: () => void;
  isCurrentMix?: boolean; // Only Current Customer Mix can upload CSV
  onCSVImport?: (parsedData: ParsedCSVData) => void; // Callback to apply CSV data
  onCopyFromCurrentMix?: () => void; // Copy from Current Mix (for Net-New Customer Mix)
  countryTotals?: Record<RegionKey, number>; // Country totals from CSV for permanent display
}

export const SegmentMixCard: React.FC<SegmentMixCardProps> = ({
  title,
  mix,
  onChange,
  onBalance,
  locked = false,
  onToggleLock,
  isCurrentMix = false,
  onCSVImport,
  onCopyFromCurrentMix,
  countryTotals,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedCSVData, setParsedCSVData] = useState<ParsedCSVData | null>(null);
  const [showCSVData, setShowCSVData] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Reconstruct CSV data from store when countryTotals exist (for persistence across refreshes)
  // Only reconstruct if parsedCSVData doesn't already exist (to preserve timestamp from fresh uploads)
  useEffect(() => {
    if (isCurrentMix && countryTotals && Object.keys(countryTotals).length > 0 && !parsedCSVData) {
      const totalLocations = Object.values(countryTotals).reduce((sum, total) => sum + total, 0);
      const countryPercentages: Record<RegionKey, number> = {} as Record<RegionKey, number>;
      
      for (const region of REGION_KEYS) {
        countryPercentages[region] = totalLocations > 0 
          ? (countryTotals[region] || 0) / totalLocations * 100 
          : 0;
      }

      const reconstructedCSVData: ParsedCSVData = {
        regionMix: mix,
        countryTotals: countryTotals as Record<RegionKey, number>,
        totalLocations,
        countryPercentages,
        // No timestamp for reconstructed data (lost on refresh)
      };
      
      setParsedCSVData(reconstructedCSVData);
      setShowCSVData(true);
    }
  }, [isCurrentMix, countryTotals, mix, parsedCSVData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const parsed = parseCSV(csvText);
        // Add upload timestamp
        const parsedWithTimestamp = {
          ...parsed,
          uploadTimestamp: Date.now(),
        };
        setParsedCSVData(parsedWithTimestamp);
        setShowCSVData(true);
        
        // Apply the parsed mix to the current mix
        if (onCSVImport) {
          onCSVImport(parsedWithTimestamp);
        }
      } catch (error) {
        alert(`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: isExpanded ? '12px' : '0',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              color: '#6b7280',
              flexShrink: 0
            }}
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>{title}</h2>
        </div>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {isCurrentMix && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                aria-label="Upload CSV file"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '4px 8px',
                  height: '28px',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                aria-label="Upload CSV"
                title="Upload CSV file"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Upload CSV
              </button>
              {parsedCSVData?.uploadTimestamp && (
                <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.2' }}>
                  {new Date(parsedCSVData.uploadTimestamp).toLocaleString()}
                </div>
              )}
            </div>
          )}
          {!isCurrentMix && onCopyFromCurrentMix && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!locked) {
                  onCopyFromCurrentMix();
                }
              }}
              style={{
                padding: '4px 8px',
                height: '28px',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
                backgroundColor: locked ? '#f3f4f6' : 'white',
                color: locked ? '#9ca3af' : '#374151',
                fontSize: '14px',
                cursor: locked ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                pointerEvents: locked ? 'none' : 'auto'
              }}
              onMouseEnter={(e) => {
                if (!locked) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!locked) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
              aria-label="Copy from Current Mix"
              title={locked ? "Unlock to copy from Current Mix" : "Copy from Current Mix"}
              disabled={locked}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy from Current Mix
            </button>
          )}
          {onToggleLock && !(isCurrentMix && countryTotals && Object.keys(countryTotals).length > 0) && (
            <button
              onClick={onToggleLock}
              style={{
                padding: '4px 8px',
                height: '28px',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
                backgroundColor: locked ? '#f3f4f6' : 'white',
                color: '#374151',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = locked ? '#e5e7eb' : '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = locked ? '#f3f4f6' : 'white'}
              aria-label={locked ? `Unlock ${title}` : `Lock ${title}`}
              title={locked ? `Unlock ${title}` : `Lock ${title}`}
            >
              {locked ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          {/* CSV Data Display Section - Always shown for Current Customer Mix when CSV is loaded */}
          {((isCurrentMix && parsedCSVData) || (!isCurrentMix && showCSVData && parsedCSVData)) && (
        <div
          style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Customer Mix by Country
            </h3>
            {!isCurrentMix && (
              <button
                onClick={() => setShowCSVData(false)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Hide
              </button>
            )}
          </div>
          
          {/* Summary */}
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Total Locations:</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                {parsedCSVData.totalLocations.toLocaleString()}
              </span>
            </div>
            {parsedCSVData.uploadTimestamp && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Uploaded:</span>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  {new Date(parsedCSVData.uploadTimestamp).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Countries Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Country</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Total Locations</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>% of Total Base</th>
                  {SEGMENT_KEYS.map((segment) => (
                    <th key={segment} style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                      {SEGMENT_LABELS[segment]} %
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGION_KEYS.map((region, index) => {
                  const regionMix = parsedCSVData.regionMix[region];
                  const countryTotal = parsedCSVData.countryTotals[region];
                  const countryPercentage = parsedCSVData.countryPercentages[region];

                  if (!regionMix) return null;

                  return (
                    <tr
                      key={region}
                      style={{
                        borderBottom: index !== REGION_KEYS.length - 1 ? '1px solid #f3f4f6' : '1px solid #e5e7eb',
                        backgroundColor: index % 2 === 0 ? 'white' : '#fafbfc',
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                        {REGION_LABELS[region]}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: '#374151' }}>
                        {countryTotal.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                        {countryPercentage.toFixed(2)}%
                      </td>
                      {SEGMENT_KEYS.map((segment) => (
                        <td key={segment} style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: '#374151' }}>
                          {regionMix[segment]}%
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                  <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                    Total
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                    {parsedCSVData.totalLocations.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                    100%
                  </td>
                  {(() => {
                    // Calculate weighted average segment mix, normalized to sum to exactly 100%
                    const weightedMix = computeWeightedSegmentMix(
                      parsedCSVData.regionMix,
                      parsedCSVData.countryTotals as Record<string, number>,
                      parsedCSVData.totalLocations
                    );
                    return SEGMENT_KEYS.map((segment) => (
                      <td key={segment} style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                        {weightedMix[segment]}%
                      </td>
                    ));
                  })()}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
          )}
          
          {/* Compact table-like layout - Hidden for Current Customer Mix when CSV data is loaded */}
          {!(isCurrentMix && parsedCSVData) && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '80px' }}>Region</th>
              {SEGMENT_KEYS.map((segment) => (
                <th key={segment} style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '90px' }}>
                  {SEGMENT_LABELS[segment]} %
                </th>
              ))}
              <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '100px' }}>Total</th>
              <th style={{ padding: '8px', width: '80px' }}></th>
            </tr>
          </thead>
          <tbody>
            {REGION_KEYS.map((region, index) => {
              const regionMix = mix?.[region];
              if (!regionMix) {
                return null;
              }
              const validation = validateMix(regionMix);
              const isValid = validation.isValid;

              return (
                <tr 
                  key={region} 
                  style={{ 
                    borderBottom: index !== REGION_KEYS.length - 1 ? '1px solid #f3f4f6' : 'none',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                  }}
                >
                  <td style={{ padding: '8px', fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                    {REGION_LABELS[region]}
                  </td>
                  {SEGMENT_KEYS.map((segment) => (
                    <td key={segment} style={{ padding: '4px 8px', textAlign: 'right' }}>
                      <PercentInput
                        value={regionMix[segment]}
                        onChange={(value) => onChange(region, segment, clampPercent(value))}
                        aria-label={`${REGION_LABELS[region]} ${SEGMENT_LABELS[segment]} percentage`}
                        className={!isValid ? "ring-2 ring-red-500 border-red-300" : ""}
                        disabled={locked}
                      />
                    </td>
                  ))}
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    <TotalBadge total={validation.total} />
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    {!isValid && onBalance && (
                      <button
                        onClick={() => onBalance(region)}
                        style={{
                          padding: '4px 8px',
                          height: '28px',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb',
                          backgroundColor: 'white',
                          color: '#374151',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        aria-label={`Balance ${REGION_LABELS[region]} mix to 100%`}
                      >
                        Balance
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
          )}
        </>
      )}
    </div>
  );
};
