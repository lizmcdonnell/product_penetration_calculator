import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RichTextEditor } from './RichTextEditor';
import { PercentInput } from './PercentInput';
import type { Product, ComplexityLevel, SegmentMix, RegionKey } from '../types';
import { SEGMENT_LABELS, SEGMENT_KEYS, REGION_KEYS } from '../types';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    name: string,
    notes: string,
    fitBySegment: SegmentMix,
    complexity: ComplexityLevel | undefined,
    currentAttachRate: number | undefined,
    backbookMultiplier: number | undefined,
    marketRelevance: RegionKey[] | undefined
  ) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [fitBySegment, setFitBySegment] = useState<SegmentMix>({
    casual: 0,
    upscaleCasual: 0,
    fineDining: 0,
    bar: 0,
    quickServe: 0,
  });
  const [complexity, setComplexity] = useState<ComplexityLevel | undefined>(undefined);
  const [currentAttachRate, setCurrentAttachRate] = useState<number | undefined>(undefined);
  const [backbookMultiplier, setBackbookMultiplier] = useState<number | undefined>(undefined);
  const [marketRelevance, setMarketRelevance] = useState<RegionKey[]>([]);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setNotes(product.notes || '');
      // Initialize segment fit from product
      setFitBySegment(product.fitBySegment || {
        casual: 0,
        upscaleCasual: 0,
        fineDining: 0,
        bar: 0,
        quickServe: 0,
      });
      setComplexity(product.complexity);
      setCurrentAttachRate(product.currentAttachRate);
      // Initialize backbookMultiplier from product, or use undefined to default to 1.0
      setBackbookMultiplier(product.backbookMultiplier);
      // Initialize market relevance from product (empty array = all countries)
      setMarketRelevance(product.marketRelevance || []);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Map region to country code
  const countryCodes: Record<RegionKey, string> = {
    belgium: 'BE',
    canada: 'CA',
    switzerland: 'CH',
    germany: 'DE',
    france: 'FR',
    luxembourg: 'LU',
    malta: 'MT',
    netherlands: 'NL',
    uk: 'GB',
    us: 'US',
  };

  const handleSave = () => {
    onSave(
      product.id,
      name.trim(),
      notes.trim(),
      fitBySegment,
      complexity,
      currentAttachRate,
      backbookMultiplier,
      marketRelevance.length > 0 ? marketRelevance : undefined
    );
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={(e) => {
        // Only close if clicking directly on the backdrop (not on child elements)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '512px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#6b7280',
                marginBottom: '8px',
              }}
            >
              {product.category}
            </div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#111827',
                margin: 0,
              }}
            >
              Product Details
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              color: '#9ca3af',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              marginLeft: '16px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#6b7280')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
            aria-label="Close modal"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {/* Product Name Field */}
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="product-name-input"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px',
              }}
            >
              Product Name
            </label>
            <input
              id="product-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
              aria-label="Product Name"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#111827',
                boxSizing: 'border-box',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const textarea = e.currentTarget.parentElement?.querySelector('textarea');
                  if (textarea) {
                    textarea.focus();
                  } else {
                    handleSave();
                  }
                }
              }}
            />
          </div>

          {/* Market Dynamics Section */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Market Dynamics
            </label>
            <div style={{ 
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '10px',
              backgroundColor: '#f9fafb',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', alignItems: 'start' }}>
                {/* Complexity */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label
                    htmlFor="complexity-select"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      minHeight: '18px',
                      lineHeight: '18px',
                    }}
                  >
                    Complexity
                  </label>
                  <select
                    id="complexity-select"
                    value={complexity || ''}
                    onChange={(e) => setComplexity((e.target.value as ComplexityLevel) || undefined)}
                    aria-label="Complexity level"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#111827',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      height: '36px',
                    }}
                  >
                    <option value="">Select...</option>
                    <option value="Low">Low (0.7x)</option>
                    <option value="Medium">Medium (0.5x)</option>
                    <option value="High">High (0.3x)</option>
                    <option value="Mandatory">Mandatory (1.0x)</option>
                  </select>
                </div>

                {/* Current Attach Rate */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label
                    htmlFor="attach-rate-input"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      minHeight: '18px',
                      lineHeight: '18px',
                      textAlign: 'center',
                    }}
                  >
                    Current Attach %
                  </label>
                  <PercentInput
                    id="attach-rate-input"
                    value={currentAttachRate ?? 0}
                    onChange={(v) => setCurrentAttachRate(v === 0 ? undefined : v)}
                    style={{ width: '100%', height: '36px' }}
                    placeholder="0"
                    aria-label="Current Attach Rate percentage"
                  />
                </div>

                {/* Backbook Multiplier */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label
                    htmlFor="backbook-multiplier-input"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      minHeight: '18px',
                      lineHeight: '18px',
                    }}
                  >
                    Backbook Mult.
                  </label>
                  <input
                    id="backbook-multiplier-input"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={backbookMultiplier ?? ''}
                    onChange={(e) => setBackbookMultiplier(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    placeholder="1.0"
                    aria-label="Backbook Multiplier (0-1)"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#111827',
                      backgroundColor: 'white',
                      boxSizing: 'border-box',
                      height: '36px',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Restaurant Segment Fit Section */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Segment Fit
            </label>
            <div style={{ 
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '10px',
              backgroundColor: '#f9fafb',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', alignItems: 'start' }}>
                {SEGMENT_KEYS.map((segment) => (
                  <div key={segment} style={{ display: 'flex', flexDirection: 'column' }}>
                    <label
                      style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        minHeight: '32px',
                        lineHeight: '16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                      }}
                      htmlFor={`segment-fit-${segment}`}
                    >
                      {SEGMENT_LABELS[segment]} %
                    </label>
                    <PercentInput
                      id={`segment-fit-${segment}`}
                      value={fitBySegment[segment]}
                      onChange={(v) => {
                        setFitBySegment({
                          ...fitBySegment,
                          [segment]: v,
                        });
                      }}
                      style={{ width: '100%', height: '36px' }}
                      placeholder="0"
                      aria-label={`${SEGMENT_LABELS[segment]} percentage`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Market Relevance Section */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Market Relevance
            </label>
            <div style={{ 
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px 10px',
              backgroundColor: '#f9fafb',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={marketRelevance.length === REGION_KEYS.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setMarketRelevance([...REGION_KEYS]);
                      } else {
                        setMarketRelevance([]);
                      }
                    }}
                    style={{
                      marginRight: '6px',
                      width: '14px',
                      height: '14px',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#374151', letterSpacing: '0.3px' }}>
                    ALL
                  </span>
                </label>
                {REGION_KEYS.map((region) => (
                    <label
                      key={region}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={marketRelevance.includes(region)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMarketRelevance([...marketRelevance, region]);
                          } else {
                            setMarketRelevance(marketRelevance.filter(r => r !== region));
                          }
                        }}
                        style={{
                          marginRight: '6px',
                          width: '14px',
                          height: '14px',
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#374151', letterSpacing: '0.3px', fontFamily: 'monospace' }}>
                        {countryCodes[region]}
                      </span>
                    </label>
                ))}
              </div>
            </div>
          </div>

          {/* Notes Field */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px',
              }}
            >
              Notes
            </label>
            <RichTextEditor
              value={notes}
              onChange={setNotes}
              placeholder="Add notes about this product... Use the toolbar to add bullet lists and links."
              rows={6}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              height: '36px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            style={{
              padding: '8px 16px',
              height: '36px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: name.trim() ? '#3b82f6' : '#9ca3af',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (name.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (name.trim()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

