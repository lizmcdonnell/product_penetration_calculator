import { useEffect } from "react";
import { useStore } from "./store";
import { SegmentMixCard } from "./components/SegmentMixCard";
import { ProductsTable } from "./components/ProductsTable";
import { ImportExportControls } from "./components/ImportExportControls";
import type { SegmentKey, RegionKey, RegionMix } from "./types";
import { SEGMENT_KEYS, REGION_KEYS } from "./types";

function App() {
  const {
    currentMix,
    newMix,
    products,
    currentMixLocked,
    newMixLocked,
    countryTotals,
    updateCurrentMixSegment,
    updateNewMixSegment,
    setCurrentMixWithTotals,
    setNewMix,
    toggleCurrentMixLock,
    toggleNewMixLock,
    addProduct,
    updateProduct,
    deleteProduct,
    resetToDefaults,
    saveVersion,
    savedVersions,
    loadVersion,
    deleteVersion,
  } = useStore();

  // Defensive check - if mix is invalid, reset to defaults (only once on mount)
  useEffect(() => {
    if (!currentMix || !newMix || !currentMix.belgium || !newMix.belgium) {
      console.warn('Invalid mix state detected, resetting to defaults');
      resetToDefaults();
    }
  }, []); // Only run once on mount

  // Don't render if mix is still invalid
  if (!currentMix || !newMix || !currentMix.belgium || !newMix.belgium) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const balanceMix = (region: RegionKey, mix: typeof currentMix[RegionKey], setter: (region: RegionKey, segment: SegmentKey, value: number) => void) => {
    const total = Object.values(mix).reduce((a, b) => a + b, 0);
    const diff = 100 - total;
    const lastSegment = SEGMENT_KEYS[SEGMENT_KEYS.length - 1];
    const currentValue = mix[lastSegment];
    setter(region, lastSegment, Math.max(0, Math.min(100, currentValue + diff)));
  };

  const handleBalanceCurrent = (region: RegionKey) => {
    balanceMix(region, currentMix[region], updateCurrentMixSegment);
  };

  const handleBalanceNew = (region: RegionKey) => {
    balanceMix(region, newMix[region], updateNewMixSegment);
  };

  const handleCopyFromCurrentMix = () => {
    // Copy the by-country segment percentages from Current Customer Mix to Net-New Customer Mix
    // This copies the segment mix (casual, upscaleCasual, fineDining, bar, quickServe) for each country
    const copiedMix: RegionMix = {} as RegionMix;
    
    // Iterate through all regions and deep copy the segment mix for each
    REGION_KEYS.forEach((regionKey) => {
      const currentRegionMix = currentMix[regionKey];
      if (currentRegionMix) {
        // Deep copy the segment mix object
        copiedMix[regionKey] = {
          casual: currentRegionMix.casual,
          upscaleCasual: currentRegionMix.upscaleCasual,
          fineDining: currentRegionMix.fineDining,
          bar: currentRegionMix.bar,
          quickServe: currentRegionMix.quickServe,
        };
      }
    });
    
    setNewMix(copiedMix);
  };

  const handleAddProduct = () => {
    addProduct({
      category: "",
      name: "New Product",
      fitBySegment: {
        casual: 0,
        upscaleCasual: 0,
        fineDining: 0,
        bar: 0,
        quickServe: 0,
      },
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
          Product Attach & Penetration Calculator
        </h1>

        {/* Segment Mix Cards - Stack on mobile, side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SegmentMixCard
            title="Current Customer Mix"
            mix={currentMix}
            onChange={updateCurrentMixSegment}
            onBalance={handleBalanceCurrent}
            locked={currentMixLocked}
            onToggleLock={toggleCurrentMixLock}
            isCurrentMix={true}
            countryTotals={countryTotals}
            onCSVImport={(parsedData) => {
              // Apply the parsed mix to the current mix with country totals for weighted calculations
              setCurrentMixWithTotals(parsedData.regionMix, parsedData.countryTotals);
            }}
          />
          <SegmentMixCard
            title="Net-New Customer Mix"
            mix={newMix}
            onChange={updateNewMixSegment}
            onBalance={handleBalanceNew}
            locked={newMixLocked}
            onToggleLock={toggleNewMixLock}
            onCopyFromCurrentMix={handleCopyFromCurrentMix}
          />
        </div>

        {/* Controls */}
        <ImportExportControls
          onReset={resetToDefaults}
        />

        {/* Products Table */}
        <ProductsTable
          products={products}
          currentMix={currentMix}
          newMix={newMix}
          countryTotals={countryTotals}
          onChangeProduct={updateProduct}
          onDeleteProduct={deleteProduct}
          onReorderProducts={useStore.getState().reorderProducts}
          onAddProduct={handleAddProduct}
          onSaveVersion={saveVersion}
          savedVersions={savedVersions}
          onLoadVersion={loadVersion}
          onDeleteVersion={deleteVersion}
        />
      </main>
    </div>
  );
}

export default App;
