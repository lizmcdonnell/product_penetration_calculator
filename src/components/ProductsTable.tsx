import React, { useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ProductModal } from "./ProductModal";
import type { Product } from "../types";
import { computeAttach, computePenetration, validateMix, roundToOneDecimal } from "../utils/calculations";
import type { RegionMix } from "../types";

interface ProductsTableProps {
  products: Product[];
  currentMix: RegionMix;
  newMix: RegionMix;
  countryTotals?: Record<string, number>;
  onChangeProduct: (id: string, updates: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onReorderProducts: (activeId: string, overId: string) => void;
  onAddProduct: () => void;
  onSaveVersion: (name: string, id?: string) => Promise<void>;
  savedVersions: Array<{ id: string; name: string; timestamp: number }>;
  onLoadVersion: (id: string) => Promise<void>;
  onDeleteVersion: (id: string) => Promise<void>;
  activeVersionId: string | null;
  hasUnsavedChanges: boolean;
}

interface EditingCell {
  productId: string;
  segment: "category";
}


// Trash icon component
const TrashIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block' }}
  >
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);
const DragHandleIcon = () => <span className="text-xs text-gray-400 cursor-grab active:cursor-grabbing">⋮⋮</span>;

// Alert icon component for unsaved changes
const AlertIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', color: '#dc2626' }}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const ChevronUpIcon = () => (
  <svg style={{ width: '8px', height: '8px', marginLeft: '4px', color: '#2563eb', display: 'inline-block', verticalAlign: 'middle' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg style={{ width: '8px', height: '8px', marginLeft: '4px', color: '#2563eb', display: 'inline-block', verticalAlign: 'middle' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const SortDotIcon = () => (
  <div style={{ width: '4px', height: '4px', backgroundColor: '#d1d5db', borderRadius: '50%', marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
);

// Sortable Row Component
interface SortableRowProps {
  product: Product;
  editingCell: EditingCell | null;
  editValue: string;
  setEditValue: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  attachRate: number | null;
  penetrationRate: number | null;
  onDeleteProduct: (id: string) => void;
  onStartEditing: (productId: string, segment: "category" | "modal", currentValue: string | number) => void;
  onSaveEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  formatRate: (rate: number | null) => string;
  isComparing?: boolean;
  selectedVersions?: Array<{ id: string; name: string; data: any }>;
  getAttachRateForVersion?: (product: Product, version: any) => number | null;
  getPenetrationRateForVersion?: (product: Product, version: any) => number | null;
  getProductFromVersion?: (productName: string, version: any) => Product | null;
}

const SortableRow: React.FC<SortableRowProps> = ({
  product,
  editingCell,
  editValue,
  setEditValue,
  inputRef,
  attachRate,
  penetrationRate,
  onDeleteProduct,
  onStartEditing,
  onSaveEdit,
  onKeyDown,
  formatRate,
  isComparing = false,
  selectedVersions = [],
  getAttachRateForVersion,
  getPenetrationRateForVersion,
  getProductFromVersion,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditingCategory = editingCell?.productId === product.id && editingCell?.segment === "category";

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        minHeight: '28px',
        alignItems: 'center',
        width: '100%'
      }}
      className="hover:bg-gray-50 group"
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#fef3c7';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '';
      }}
    >
      {/* Drag handle column */}
      <div style={{ width: '5%', minWidth: '40px', padding: '2px 4px' }} className="flex items-center justify-center">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
        >
          <DragHandleIcon />
        </div>
      </div>
      
      {/* Product Category column */}
      <div style={{ width: isComparing && selectedVersions.length > 0 ? '15%' : '20%', minWidth: isComparing && selectedVersions.length > 0 ? '150px' : '180px', padding: '2px 4px 2px 16px' }}>
        {isEditingCategory ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={onKeyDown}
            className="w-full px-2 py-0 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            aria-label="Edit product category"
            style={{ fontSize: '14px', lineHeight: '1.2' }}
          />
        ) : (
          <button
            onClick={() => onStartEditing(product.id, "category", product.category)}
            className="text-left w-full px-2 py-0 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm transition-colors"
            aria-label={`Edit product category: ${product.category}`}
            style={{ fontSize: '14px', fontWeight: '500', lineHeight: '1.2' }}
          >
            {product.category || "—"}
          </button>
        )}
      </div>
      
      {/* Product Name column */}
      <div style={{ width: isComparing && selectedVersions.length > 0 ? '20%' : '35%', minWidth: isComparing && selectedVersions.length > 0 ? '180px' : '240px', padding: '2px 4px' }}>
        <button
          onClick={() => onStartEditing(product.id, "modal", product.name)}
          className="text-left w-full px-2 py-0 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm transition-colors cursor-pointer"
          aria-label={`View product details: ${product.name}`}
          style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: '1.1' }}
        >
          {product.name}
        </button>
      </div>
      
      {/* Current State Columns */}
      {(!isComparing || selectedVersions.length === 0) && (
        <>
          {/* Attach % column */}
          <div style={{ width: '15%', minWidth: '100px', padding: '2px 4px' }} className="text-right">
            <div className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'monospace', fontWeight: '600', lineHeight: '1.2' }}>
              {formatRate(attachRate)}
            </div>
          </div>
          
          {/* Penetration % column */}
          <div style={{ width: '15%', minWidth: '100px', padding: '2px 4px' }} className="text-right">
            <div className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'monospace', fontWeight: '600', lineHeight: '1.2' }}>
              {formatRate(penetrationRate)}
            </div>
          </div>
        </>
      )}

      {/* Comparison Columns */}
      {isComparing && selectedVersions.length > 0 && getAttachRateForVersion && getPenetrationRateForVersion && getProductFromVersion && (
        <>
          {/* Attach % Columns */}
          {/* Current State Attach */}
          <div style={{ width: `${35 / (selectedVersions.length + 1)}%`, minWidth: '80px', padding: '2px 4px' }} className="text-right">
            <div className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'monospace', fontWeight: '600', lineHeight: '1.2' }}>
              {formatRate(attachRate)}
            </div>
          </div>
          
          {/* Version Attach Values */}
          {selectedVersions.map((version) => {
            const versionProduct = getProductFromVersion(product.name, version.data);
            const versionAttach = versionProduct ? getAttachRateForVersion(versionProduct, version.data) : null;
            
            // Calculate differences for visual indicators
            const attachDiff = attachRate !== null && versionAttach !== null ? versionAttach - attachRate : 0;
            
            // Determine background color based on difference
            const getBackgroundColor = (diff: number) => {
              if (Math.abs(diff) < 0.1) return 'transparent'; // No significant difference
              if (diff > 0) return '#d1fae5'; // Green for positive (higher)
              return '#fee2e2'; // Red for negative (lower)
            };
            
            const versionWidth = `${35 / (selectedVersions.length + 1)}%`;
            return (
              <div key={`attach-${version.id}`} style={{ width: versionWidth, minWidth: '80px', padding: '2px 4px' }} className="text-right">
                <div 
                  className="text-sm font-semibold text-gray-900" 
                  style={{ 
                    fontFamily: 'monospace', 
                    fontWeight: '600', 
                    lineHeight: '1.2',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    backgroundColor: getBackgroundColor(attachDiff),
                    transition: 'background-color 0.2s',
                    display: 'inline-block'
                  }}
                >
                  {formatRate(versionAttach)}
                </div>
              </div>
            );
          })}
          
          {/* Penetration % Columns - with visual separator */}
          {/* Current State Penetration */}
          <div 
            style={{ 
              width: `${35 / (selectedVersions.length + 1)}%`, 
              minWidth: '80px', 
              padding: '2px 4px',
              borderLeft: '2px solid #d1d5db',
              backgroundColor: '#fafbfc'
            }} 
            className="text-right"
          >
            <div className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'monospace', fontWeight: '600', lineHeight: '1.2' }}>
              {formatRate(penetrationRate)}
            </div>
          </div>
          
          {/* Version Penetration Values */}
          {selectedVersions.map((version) => {
            const versionProduct = getProductFromVersion(product.name, version.data);
            const versionPenetration = versionProduct ? getPenetrationRateForVersion(versionProduct, version.data) : null;
            
            // Calculate differences for visual indicators
            const penetrationDiff = penetrationRate !== null && versionPenetration !== null ? versionPenetration - penetrationRate : 0;
            
            // Determine background color based on difference (overlay on light gray)
            const getBackgroundColor = (diff: number) => {
              if (Math.abs(diff) < 0.1) return '#fafbfc'; // Light gray background for no difference
              if (diff > 0) return '#d1fae5'; // Green for positive (higher)
              return '#fee2e2'; // Red for negative (lower)
            };
            
            const versionWidth = `${35 / (selectedVersions.length + 1)}%`;
            return (
              <div 
                key={`penetration-${version.id}`} 
                style={{ 
                  width: versionWidth, 
                  minWidth: '80px', 
                  padding: '2px 4px',
                  backgroundColor: '#fafbfc'
                }} 
                className="text-right"
              >
                <div 
                  className="text-sm font-semibold text-gray-900" 
                  style={{ 
                    fontFamily: 'monospace', 
                    fontWeight: '600', 
                    lineHeight: '1.2',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    backgroundColor: getBackgroundColor(penetrationDiff),
                    transition: 'background-color 0.2s',
                    display: 'inline-block'
                  }}
                >
                  {formatRate(versionPenetration)}
                </div>
              </div>
            );
          })}
        </>
      )}
      
      {/* Delete button column */}
      <div style={{ width: '10%', minWidth: '80px', padding: '2px 4px' }} className="text-center">
        <button
          onClick={() => onDeleteProduct(product.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            padding: '2px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s',
            margin: '0 auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
            e.currentTarget.style.borderColor = '#dc2626';
            e.currentTarget.style.color = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#6b7280';
          }}
          aria-label={`Delete ${product.name}`}
          title={`Delete ${product.name}`}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  currentMix,
  newMix,
  countryTotals,
  onChangeProduct,
  onDeleteProduct,
  onReorderProducts,
  onAddProduct,
  onSaveVersion,
  savedVersions,
  onLoadVersion,
  onDeleteVersion,
  activeVersionId,
  hasUnsavedChanges,
}) => {
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ column: 'category' | 'attach' | 'penetration' | null; direction: 'asc' | 'desc' }>({ column: null, direction: 'asc' });
  const [isComparing, setIsComparing] = useState(false);
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);

  const handleSaveClick = () => {
    setShowSavePrompt(true);
    setVersionName("");
    setSelectedVersionId(null);
  };

  const handleSaveConfirm = async () => {
    if (versionName.trim()) {
      await onSaveVersion(versionName.trim(), selectedVersionId || undefined);
      setShowSavePrompt(false);
      setVersionName("");
      setSelectedVersionId(null);
    }
  };

  const handleSelectExistingVersion = (version: { id: string; name: string }) => {
    setVersionName(version.name);
    setSelectedVersionId(version.id);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVersionName(e.target.value);
    // Clear selected version ID if user types a different name
    if (selectedVersionId) {
      const selectedVersion = savedVersions.find(v => v.id === selectedVersionId);
      if (selectedVersion && e.target.value !== selectedVersion.name) {
        setSelectedVersionId(null);
      }
    }
  };

  const handleSaveCancel = () => {
    setShowSavePrompt(false);
    setVersionName("");
    setSelectedVersionId(null);
  };

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Validate that all regions have valid mixes (each region's mix must sum to 100)
  // Add defensive checks
  if (!currentMix || !newMix) {
    return null; // Don't render if mix is invalid
  }
  
  const currentMixValid = Object.values(currentMix).every(mix => mix && validateMix(mix).isValid);
  const newMixValid = Object.values(newMix).every(mix => mix && validateMix(mix).isValid);
  const canCalculate = currentMixValid && newMixValid;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderProducts(active.id as string, over.id as string);
    }
  };

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const startEditing = (productId: string, segment: "category" | "modal", currentValue: string | number) => {
    if (segment === "modal") {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        setIsModalOpen(true);
      }
      return;
    }
    setEditingCell({ productId, segment });
    setEditValue(currentValue.toString());
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const saveEdit = () => {
    if (!editingCell) return;

    const { productId, segment } = editingCell;
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (segment === "category") {
      const newCategory = editValue.trim();
      onChangeProduct(productId, { category: newCategory });
    }

    cancelEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  const getAttachRate = (product: Product) => {
    if (!canCalculate) return null;
    return roundToOneDecimal(computeAttach(product, newMix, countryTotals, currentMix));
  };

  const getPenetrationRate = (product: Product) => {
    if (!canCalculate) return null;
    return roundToOneDecimal(computePenetration(product, currentMix, countryTotals, newMix));
  };

  const formatRate = (rate: number | null) => {
    if (rate === null) return "—";
    return `${rate.toFixed(1)}%`;
  };

  const handleSort = (column: 'category' | 'attach' | 'penetration') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column, direction });
  };

  const getSortIcon = (column: 'category' | 'attach' | 'penetration') => {
    if (sortConfig.column !== column) {
      return <SortDotIcon />;
    }
    return sortConfig.direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />;
  };

  const getSortedProducts = () => {
    if (!sortConfig.column) return products;

    return [...products].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortConfig.column === 'category') {
        aValue = a.category || '';
        bValue = b.category || '';
      } else if (sortConfig.column === 'attach') {
        aValue = getAttachRate(a) ?? 0;
        bValue = getAttachRate(b) ?? 0;
      } else { // penetration
        aValue = getPenetrationRate(a) ?? 0;
        bValue = getPenetrationRate(b) ?? 0;
      }

      if (sortConfig.column === 'category') {
        // String comparison
        const comparison = (aValue as string).localeCompare(bValue as string);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      } else {
        // Number comparison
        const comparison = (aValue as number) - (bValue as number);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
    });
  };

  // Get version data by ID
  const getVersionById = (id: string) => {
    // Load versions from localStorage to get full data
    try {
      const stored = localStorage.getItem("product-penetration-versions");
      if (!stored) return null;
      const versions = JSON.parse(stored);
      return versions.find((v: any) => v.id === id) || null;
    } catch {
      return null;
    }
  };

  // Calculate attach/penetration for a product in a specific version
  const getAttachRateForVersion = (product: Product, version: any) => {
    if (!canCalculate || !version?.state) return null;
    return roundToOneDecimal(
      computeAttach(product, version.state.newMix, version.state.countryTotals || countryTotals, version.state.currentMix)
    );
  };

  const getPenetrationRateForVersion = (product: Product, version: any) => {
    if (!canCalculate || !version?.state) return null;
    return roundToOneDecimal(
      computePenetration(product, version.state.currentMix, version.state.countryTotals || countryTotals, version.state.newMix)
    );
  };

  // Get product by name from version (to match products across versions)
  const getProductFromVersion = (productName: string, version: any): Product | null => {
    if (!version?.state?.products) return null;
    return version.state.products.find((p: Product) => p.name === productName) || null;
  };

  const handleToggleComparison = () => {
    setIsComparing(!isComparing);
    if (!isComparing) {
      // When starting comparison, ensure at least current state is included
      setSelectedVersionIds([]);
    } else {
      setSelectedVersionIds([]);
    }
  };

  const handleToggleVersion = (versionId: string) => {
    setSelectedVersionIds(prev => 
      prev.includes(versionId) 
        ? prev.filter(id => id !== versionId)
        : [...prev, versionId]
    );
  };

  // Get selected versions data
  const selectedVersions = selectedVersionIds
    .map(id => {
      const version = getVersionById(id);
      return version ? { id, name: version.name, data: version } : null;
    })
    .filter((v): v is { id: string; name: string; data: any } => v !== null);

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        maxWidth: '100%'
      }}
      className="bg-white rounded-lg shadow"
    >
      <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Products</h2>
      </div>

      {!canCalculate && (
        <div className="mx-4 mt-4 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 px-3 py-2 text-sm">
          ⚠️ Segment mixes must total 100% to calculate results
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className={`overflow-x-auto ${!canCalculate ? "opacity-60 pointer-events-none" : ""}`} style={{ paddingRight: '48px', position: 'relative', zIndex: 1 }}>
          {/* Sticky header container */}
          <div style={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 1001,
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            width: '100%'
          }}>
            <div style={{ width: '5%', minWidth: '40px', padding: '2px 4px' }} className="text-center text-sm font-medium text-gray-900"></div>
            <div 
              style={{ width: isComparing && selectedVersions.length > 0 ? '15%' : '20%', minWidth: '150px', padding: '2px 4px 2px 16px' }} 
              className="text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleSort('category')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>Product Category</span>
                {getSortIcon('category')}
              </div>
            </div>
            <div style={{ width: isComparing && selectedVersions.length > 0 ? '20%' : '35%', minWidth: isComparing && selectedVersions.length > 0 ? '180px' : '240px', padding: '2px 4px' }} className="text-left text-sm font-medium text-gray-900">
              Product Name
            </div>
            
            {/* Current State Columns */}
            {(!isComparing || selectedVersions.length === 0) && (
              <>
                <div
                  style={{ width: '15%', minWidth: '100px', padding: '2px 4px' }}
                  className="text-right text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                  title="Attach (New Customers): Calculated as a weighted average across selected countries, then adjusted to be relative to the full customer base. If a product is only relevant to 19.37% of the base, its attach rate reflects that coverage."
                  onClick={() => handleSort('attach')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    <span>Attach %</span>
                    {getSortIcon('attach')}
                  </div>
                </div>
                <div
                  style={{ width: '15%', minWidth: '100px', padding: '2px 4px' }}
                  className="text-right text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                  title="Penetration (Existing Customers): Calculated as a weighted average across selected countries with complexity and backbook friction adjustments, then adjusted to be relative to the full customer base. If a product is only relevant to 19.37% of the base, its penetration rate reflects that coverage."
                  onClick={() => handleSort('penetration')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    <span>Penetration %</span>
                    {getSortIcon('penetration')}
                  </div>
                </div>
              </>
            )}

            {/* Comparison Columns */}
            {isComparing && selectedVersions.length > 0 && (
              <>
                {/* Attach % Columns */}
                <div
                  style={{ width: `${35 / (selectedVersions.length + 1)}%`, minWidth: '80px', padding: '2px 4px' }}
                  className="text-right text-sm font-medium text-gray-900"
                  title="Attach % - Current State"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>Attach %</span>
                    <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '400' }}>Current</span>
                  </div>
                </div>
                
                {selectedVersions.map((version) => {
                  const versionWidth = `${35 / (selectedVersions.length + 1)}%`;
                  return (
                    <div
                      key={`attach-${version.id}`}
                      style={{ width: versionWidth, minWidth: '80px', padding: '2px 4px' }}
                      className="text-right text-sm font-medium text-gray-900"
                      title={`Attach % - ${version.name}`}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>Attach %</span>
                        <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '400' }}>{version.name}</span>
                      </div>
                    </div>
                  );
                })}
                
                {/* Penetration % Columns - with visual separator */}
                <div
                  style={{ 
                    width: `${35 / (selectedVersions.length + 1)}%`, 
                    minWidth: '80px', 
                    padding: '2px 4px',
                    borderLeft: '2px solid #d1d5db',
                    backgroundColor: '#fafbfc'
                  }}
                  className="text-right text-sm font-medium text-gray-900"
                  title="Penetration % - Current State"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>Penetration %</span>
                    <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '400' }}>Current</span>
                  </div>
                </div>
                
                {selectedVersions.map((version) => {
                  const versionWidth = `${35 / (selectedVersions.length + 1)}%`;
                  return (
                    <div
                      key={`penetration-${version.id}`}
                      style={{ 
                        width: versionWidth, 
                        minWidth: '80px', 
                        padding: '2px 4px',
                        backgroundColor: '#fafbfc'
                      }}
                      className="text-right text-sm font-medium text-gray-900"
                      title={`Penetration % - ${version.name}`}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>Penetration %</span>
                        <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '400' }}>{version.name}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <div style={{ width: '10%', minWidth: '80px', padding: '2px 4px' }} className="text-center">
            </div>
          </div>
          
          {/* Data rows */}
          <div style={{ width: '100%' }}>
            <SortableContext items={getSortedProducts().map(p => p.id)} strategy={verticalListSortingStrategy}>
              {getSortedProducts().map((product) => {
                const attachRate = getAttachRate(product);
                const penetrationRate = getPenetrationRate(product);

                return (
                  <SortableRow
                    key={product.id}
                    product={product}
                    editingCell={editingCell}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    inputRef={inputRef}
                    attachRate={attachRate}
                    penetrationRate={penetrationRate}
                    onDeleteProduct={onDeleteProduct}
                    onStartEditing={startEditing}
                    onSaveEdit={saveEdit}
                    onKeyDown={handleKeyDown}
                    formatRate={formatRate}
                    isComparing={isComparing}
                    selectedVersions={selectedVersions}
                    getAttachRateForVersion={getAttachRateForVersion}
                    getPenetrationRateForVersion={getPenetrationRateForVersion}
                    getProductFromVersion={getProductFromVersion}
                  />
                );
              })}
              {products.length === 0 && (
                <div style={{ 
                  display: 'flex', 
                  borderBottom: '1px solid #e5e7eb',
                  minHeight: '60px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px',
                  color: '#6b7280'
                }}>
                  No products. Click "Add Row" to get started.
                </div>
              )}
            </SortableContext>
          </div>
        </div>
      </DndContext>
      
      <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: savedVersions.length > 0 || isComparing ? '12px' : '0' }}>
          <button
            onClick={onAddProduct}
            style={{
              padding: '6px 16px',
              height: '36px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            aria-label="Add product row"
          >
            + Add Row
          </button>
          <button
            onClick={handleSaveClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              height: '36px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            aria-label="Save current state"
          >
            Save
            {activeVersionId && hasUnsavedChanges && (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <AlertIcon />
              </span>
            )}
          </button>
          {savedVersions.length > 0 && (
            <button
              onClick={handleToggleComparison}
              style={{
                padding: '6px 16px',
                height: '36px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: isComparing ? '#3b82f6' : 'white',
                color: isComparing ? 'white' : '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isComparing) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isComparing) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
              aria-label={isComparing ? "Exit comparison mode" : "Compare versions"}
            >
              {isComparing ? 'Exit Compare' : 'Compare Versions'}
            </button>
          )}
        </div>

        {/* Comparison Mode - Version Selector */}
        {isComparing && savedVersions.length > 0 && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '16px', 
            backgroundColor: '#f9fafb', 
            borderRadius: '8px', 
            border: '1px solid #e5e7eb' 
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
              Select versions to compare (current state is always included):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {savedVersions.map((version) => (
                <label
                  key={version.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: selectedVersionIds.includes(version.id) ? '#dbeafe' : 'white',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedVersionIds.includes(version.id)) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedVersionIds.includes(version.id)) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedVersionIds.includes(version.id)}
                    onChange={() => handleToggleVersion(version.id)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  <span>{version.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Save Prompt Modal */}
        {showSavePrompt && (
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
              zIndex: 1000
            }}
            onClick={handleSaveCancel}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
                Save Version
              </h3>
              
              {/* Existing Versions List */}
              {savedVersions.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                    Save to existing version or create new:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px' }}>
                    {savedVersions.map((version) => (
                      <button
                        key={version.id}
                        onClick={() => handleSelectExistingVersion(version)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: selectedVersionId === version.id ? '#dbeafe' : 'transparent',
                          color: selectedVersionId === version.id ? '#1e40af' : '#374151',
                          fontSize: '13px',
                          fontWeight: selectedVersionId === version.id ? '600' : '500',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedVersionId !== version.id) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedVersionId !== version.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {version.name}
                        {selectedVersionId === version.id && ' ✓'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <label 
                htmlFor="version-name-input"
                style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}
              >
                {selectedVersionId ? 'Version name (will overwrite selected version):' : 'New version name:'}
              </label>
              <input
                id="version-name-input"
                type="text"
                value={versionName}
                onChange={handleNameChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveConfirm();
                  } else if (e.key === 'Escape') {
                    handleSaveCancel();
                  }
                }}
                placeholder={selectedVersionId ? "Version name..." : "Enter new version name..."}
                autoFocus
                aria-label={selectedVersionId ? 'Version name (will overwrite selected version)' : 'New version name'}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '16px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSaveCancel}
                  style={{
                    padding: '6px 16px',
                    height: '36px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfirm}
                  disabled={!versionName.trim()}
                  style={{
                    padding: '6px 16px',
                    height: '36px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: versionName.trim() ? '#3b82f6' : '#9ca3af',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: versionName.trim() ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (versionName.trim()) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (versionName.trim()) {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                    }
                  }}
                >
                  {selectedVersionId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Versions */}
        {savedVersions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {savedVersions.map((version) => {
              const isActive = activeVersionId === version.id;
              
              return (
                <div
                  key={version.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px',
                    borderRadius: '6px',
                    border: isActive ? '1px solid #2563eb' : '1px solid #e5e7eb',
                    backgroundColor: isActive ? '#eff6ff' : 'white',
                    transition: 'background-color 0.2s, border-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <button
                    onClick={async () => await onLoadVersion(version.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      height: '32px',
                      border: 'none',
                      backgroundColor: isActive ? '#3b82f6' : 'transparent',
                      color: isActive ? '#ffffff' : '#374151',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s, color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    aria-label={`Load version: ${version.name}`}
                  >
                    {version.name}
                  </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete version "${version.name}"?`)) {
                      await onDeleteVersion(version.id);
                    }
                  }}
                  style={{
                    padding: '4px 6px',
                    height: '32px',
                    width: '24px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fee2e2';
                    e.currentTarget.style.color = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                  aria-label={`Delete version: ${version.name}`}
                  title={`Delete version: ${version.name}`}
                >
                  ×
                </button>
              </div>
              );
            })}
          </div>
        )}

        {/* How is this calculated? Section */}
        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#374151',
              listStyle: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              userSelect: 'none'
            }}
            onMouseDown={(e) => e.preventDefault()}
            >
              <span>How are these calculated?</span>
              <span style={{ fontSize: '12px', color: '#6b7280', transition: 'transform 0.2s' }}>▼</span>
            </summary>
            <div style={{ marginTop: '16px', paddingLeft: '0', fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#111827' }}>Attach (New Customers)</strong>
                <p style={{ marginTop: '4px', marginBottom: '0' }}>
                  For each selected country, we blend the product's segment fit with that country's net-new segment mix to get an attach potential.
                </p>
                <p style={{ marginTop: '4px', marginBottom: '0' }}>
                  If a current attach rate exists, we use it as an anchor (with a small +10% forward bias).
                </p>
                <p style={{ marginTop: '4px', marginBottom: '0' }}>
                  We then take the market-weighted average across selected countries using each country's % of total net-new locations.
                </p>
                <p style={{ marginTop: '4px', marginBottom: '0', fontWeight: '500' }}>
                  Finally, we adjust this rate to be relative to the <strong>full customer base</strong> by multiplying by the coverage percentage. 
                  For example, if a product is only relevant to Germany (19.37% of the base) and has an 80% attach rate within Germany, 
                  the attach rate relative to the full base is 80% × 19.37% = 15.5%.
                </p>
              </div>
              <div>
                <strong style={{ color: '#111827' }}>Penetration (Existing Customers)</strong>
                <p style={{ marginTop: '4px', marginBottom: '0' }}>
                  For each selected country, we blend segment fit with that country's current segment mix, then adjust down for:
                </p>
                <ul style={{ marginTop: '4px', marginBottom: '0', paddingLeft: '20px' }}>
                  <li>Product Complexity (Low = 0.7, Medium = 0.5, High = 0.3, Mandatory = 1.0)</li>
                  <li>Backbook Friction (default = 1.0, can be customized per product)</li>
                </ul>
                <p style={{ marginTop: '4px', marginBottom: '0' }}>
                  If a current attach rate exists, it anchors penetration (no segment fit needed).
                </p>
                <p style={{ marginTop: '4px', marginBottom: '0' }}>
                  We take the market-weighted average using each country's % of the existing base.
                </p>
                <p style={{ marginTop: '4px', marginBottom: '0', fontWeight: '500' }}>
                  Finally, we adjust this rate to be relative to the <strong>full customer base</strong> by multiplying by the coverage percentage. 
                  Countries not selected contribute 0 to the final rate.
                </p>
                <p style={{ marginTop: '8px', marginBottom: '0', fontStyle: 'italic', color: '#6b7280' }}>
                  This yields realistic attach vs. sell-into penetration that respects country relevance, base size, and product friction.
                </p>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={(id, name, notes, fitBySegment, complexity, currentAttachRate, backbookMultiplier, marketRelevance) => {
          onChangeProduct(id, {
            name,
            notes,
            fitBySegment,
            complexity,
            currentAttachRate,
            backbookMultiplier,
            marketRelevance,
          });
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};
