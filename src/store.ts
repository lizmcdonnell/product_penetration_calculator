import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppState, Product, SegmentKey, RegionMix, RegionKey, SegmentMix } from "./types";
import { DEFAULT_CURRENT_MIX, DEFAULT_NEW_MIX, DEFAULT_PRODUCTS, REGION_KEYS } from "./types";

export type SavedVersion = {
  id: string;
  name: string;
  timestamp: number;
  state: AppState;
};

interface Store extends AppState {
  // Lock state
  currentMixLocked: boolean;
  newMixLocked: boolean;
  // Country totals for weighted calculations (from CSV)
  countryTotals: Record<RegionKey, number>;
  // Actions
  setCurrentMix: (mix: RegionMix) => void;
  setCurrentMixWithTotals: (mix: RegionMix, totals: Record<RegionKey, number>) => void;
  updateCurrentMixSegment: (region: RegionKey, segment: SegmentKey, value: number) => void;
  setNewMix: (mix: RegionMix) => void;
  updateNewMixSegment: (region: RegionKey, segment: SegmentKey, value: number) => void;
  toggleCurrentMixLock: () => void;
  toggleNewMixLock: () => void;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  reorderProducts: (activeId: string, overId: string) => void;
  resetToDefaults: () => void;
  importState: (state: AppState) => void;
  // Version management
  savedVersions: SavedVersion[];
  saveVersion: (name: string, id?: string) => void;
  loadVersion: (id: string) => void;
  deleteVersion: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const createInitialProducts = (): Product[] => {
  return DEFAULT_PRODUCTS.map(p => ({
    ...p,
    id: generateId(),
  }));
};

// Migration function to convert old formats to new region format
const migrateToRegionMix = (oldState: any): AppState | null => {
  try {
    // Check if it's the old SegmentMix format (has SegmentMix directly, not RegionMix)
    if (oldState && oldState.currentMix && typeof oldState.currentMix === 'object' && 'casual' in oldState.currentMix && !('uk' in oldState.currentMix)) {
      // Old SegmentMix format - convert to new RegionMix with all countries
      const oldCurrentMix = oldState.currentMix;
      const oldNewMix = oldState.newMix;
      
      const newCurrentMix: RegionMix = {
        belgium: { ...oldCurrentMix },
        canada: { ...oldCurrentMix },
        switzerland: { ...oldCurrentMix },
        germany: { ...oldCurrentMix },
        france: { ...oldCurrentMix },
        luxembourg: { ...oldCurrentMix },
        malta: { ...oldCurrentMix },
        netherlands: { ...oldCurrentMix },
        uk: { ...oldCurrentMix },
        us: { ...oldCurrentMix },
      };
      
      const newNewMix: RegionMix = {
        belgium: { ...oldNewMix },
        canada: { ...oldNewMix },
        switzerland: { ...oldNewMix },
        germany: { ...oldNewMix },
        france: { ...oldNewMix },
        luxembourg: { ...oldNewMix },
        malta: { ...oldNewMix },
        netherlands: { ...oldNewMix },
        uk: { ...oldNewMix },
        us: { ...oldNewMix },
      };
      
      return {
        currentMix: newCurrentMix,
        newMix: newNewMix,
        products: oldState.products || createInitialProducts(),
      };
    }
    
    // Check if it's the old RegionMix format (has old regions like benelux, row)
    if (oldState && oldState.currentMix && oldState.currentMix.uk && !oldState.currentMix.belgium) {
      // Old RegionMix format - migrate to new countries
      const oldCurrentMix = oldState.currentMix;
      const oldNewMix = oldState.newMix;
      
      // Map old regions to new ones, or use defaults
      const getRegionMix = (oldMix: any, region: RegionKey): SegmentMix => {
        // Try to map old regions to new ones
        if (region === 'belgium' || region === 'luxembourg' || region === 'netherlands') {
          return oldMix.benelux ? { ...oldMix.benelux } : DEFAULT_CURRENT_MIX[region];
        }
        if (region === 'us' || region === 'canada') {
          return oldMix.row ? { ...oldMix.row } : DEFAULT_CURRENT_MIX[region];
        }
        // Direct mappings
        if (region === 'uk' && oldMix.uk) return { ...oldMix.uk };
        if (region === 'germany' && oldMix.germany) return { ...oldMix.germany };
        if (region === 'france' && oldMix.france) return { ...oldMix.france };
        // New regions get defaults
        return DEFAULT_CURRENT_MIX[region];
      };
      
      const newCurrentMix: RegionMix = {
        belgium: getRegionMix(oldCurrentMix, 'belgium'),
        canada: getRegionMix(oldCurrentMix, 'canada'),
        switzerland: getRegionMix(oldCurrentMix, 'switzerland'),
        germany: getRegionMix(oldCurrentMix, 'germany'),
        france: getRegionMix(oldCurrentMix, 'france'),
        luxembourg: getRegionMix(oldCurrentMix, 'luxembourg'),
        malta: getRegionMix(oldCurrentMix, 'malta'),
        netherlands: getRegionMix(oldCurrentMix, 'netherlands'),
        uk: getRegionMix(oldCurrentMix, 'uk'),
        us: getRegionMix(oldCurrentMix, 'us'),
      };
      
      const newNewMix: RegionMix = {
        belgium: getRegionMix(oldNewMix, 'belgium'),
        canada: getRegionMix(oldNewMix, 'canada'),
        switzerland: getRegionMix(oldNewMix, 'switzerland'),
        germany: getRegionMix(oldNewMix, 'germany'),
        france: getRegionMix(oldNewMix, 'france'),
        luxembourg: getRegionMix(oldNewMix, 'luxembourg'),
        malta: getRegionMix(oldNewMix, 'malta'),
        netherlands: getRegionMix(oldNewMix, 'netherlands'),
        uk: getRegionMix(oldNewMix, 'uk'),
        us: getRegionMix(oldNewMix, 'us'),
      };
      
      return {
        currentMix: newCurrentMix,
        newMix: newNewMix,
        products: oldState.products || createInitialProducts(),
      };
    }
    
    // Already in new format or invalid, return null to use defaults
    return null;
  } catch (error) {
    console.error('Error migrating state:', error);
    return null;
  }
};

// Helper to load/save versions from localStorage
const VERSIONS_STORAGE_KEY = "product-penetration-versions";

const loadVersions = (): SavedVersion[] => {
  try {
    const stored = localStorage.getItem(VERSIONS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    // Validate and ensure all saved versions have complete product data
    return parsed.map((v: any) => {
      if (!v.state || !v.state.products) return v;
      
      // Ensure products have all required fields (category, name, notes, fitBySegment, market dynamics, competitors)
      const validatedProducts = v.state.products.map((p: any) => ({
        id: p.id || generateId(),
        category: p.category || '',
        name: p.name || '',
        notes: p.notes || '',
        fitBySegment: p.fitBySegment || {
          casual: 0,
          upscaleCasual: 0,
          fineDining: 0,
          bar: 0,
          quickServe: 0,
        },
        // Handle migration from old field names
        percentWhoWantIt: p.percentWhoWantIt ?? p.percentWhoWillPay,
        percentWhoCanUseIt: p.percentWhoCanUseIt ?? p.percentWhoWillUse,
        complexity: p.complexity,
        currentAttachRate: p.currentAttachRate,
        backbookMultiplier: p.backbookMultiplier,
        marketRelevance: p.marketRelevance ? [...p.marketRelevance] : undefined,
        competitors: p.competitors || undefined,
      }));
      
      return {
        ...v,
        state: {
          ...v.state,
          products: validatedProducts,
        },
      };
    });
  } catch (error) {
    console.error('Error loading versions:', error);
    return [];
  }
};

const saveVersions = (versions: SavedVersion[]) => {
  try {
    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(versions));
  } catch (error) {
    console.error('Error saving versions:', error);
  }
};

export const useStore = create<Store>()(
  persist(
    (set) => (    {
      currentMix: DEFAULT_CURRENT_MIX,
      newMix: DEFAULT_NEW_MIX,
      products: createInitialProducts(),
      savedVersions: loadVersions(),
      currentMixLocked: false,
      newMixLocked: false,
      countryTotals: {} as Record<RegionKey, number>,

      setCurrentMix: (mix: RegionMix) => set({ currentMix: mix }),
      setCurrentMixWithTotals: (mix: RegionMix, totals: Record<RegionKey, number>) => set({ 
        currentMix: mix, 
        countryTotals: totals,
        currentMixLocked: true, // Automatically lock when CSV data is loaded
      }),
      updateCurrentMixSegment: (region: RegionKey, segment: SegmentKey, value: number) =>
        set((state: Store) => ({
          currentMix: {
            ...state.currentMix,
            [region]: {
              ...state.currentMix[region],
              [segment]: value,
            },
          },
        })),
      setNewMix: (mix: RegionMix) => set({ newMix: mix }),
      updateNewMixSegment: (region: RegionKey, segment: SegmentKey, value: number) =>
        set((state: Store) => ({
          newMix: {
            ...state.newMix,
            [region]: {
              ...state.newMix[region],
              [segment]: value,
            },
          },
        })),
      toggleCurrentMixLock: () =>
        set((state: Store) => {
          // If countryTotals exist, Current Mix should stay locked (CSV format is permanent)
          const hasCountryTotals = state.countryTotals && Object.keys(state.countryTotals).length > 0;
          if (hasCountryTotals) {
            // Keep it locked - CSV format should not be unlocked
            return { currentMixLocked: true };
          }
          // When locking, the current state is already saved (it's already persisted)
          return { currentMixLocked: !state.currentMixLocked };
        }),
      toggleNewMixLock: () =>
        set((state: Store) => {
          // When locking, the current state is already saved (it's already persisted)
          return { newMixLocked: !state.newMixLocked };
        }),
      addProduct: (product: Omit<Product, 'id'>) =>
        set((state: Store) => ({
          products: [
            ...state.products,
            { ...product, id: generateId() },
          ],
        })),
      updateProduct: (id: string, updates: Partial<Product>) =>
        set((state: Store) => ({
          products: state.products.map((p: Product) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deleteProduct: (id: string) =>
        set((state: Store) => ({
          products: state.products.filter((p: Product) => p.id !== id),
        })),
      duplicateProduct: (id: string) =>
        set((state: Store) => {
          const product = state.products.find((p: Product) => p.id === id);
          if (!product) return state;
          return {
            products: [
              ...state.products,
              { ...product, id: generateId() },
            ],
          };
        }),
      reorderProducts: (activeId: string, overId: string) =>
        set((state: Store) => {
          const activeIndex = state.products.findIndex((p: Product) => p.id === activeId);
          const overIndex = state.products.findIndex((p: Product) => p.id === overId);
          
          if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
            return state;
          }
          
          const newProducts = [...state.products];
          const [removed] = newProducts.splice(activeIndex, 1);
          newProducts.splice(overIndex, 0, removed);
          
          return { products: newProducts };
        }),
      resetToDefaults: () =>
        set((state: Store) => {
          // Reset percentage fields only - preserve product category and name
          // Reset customer mixes to defaults
          const resetCurrentMix = DEFAULT_CURRENT_MIX;
          const resetNewMix = DEFAULT_NEW_MIX;
          
          // Reset product fit percentages to 0, but preserve category, name, notes, market dynamics, and competitors
          const resetProducts = state.products.map((p: Product) => ({
            id: p.id,
            category: p.category, // Preserve category
            name: p.name, // Preserve name
            notes: p.notes || '', // Preserve notes
            fitBySegment: {
              casual: 0,
              upscaleCasual: 0,
              fineDining: 0,
              bar: 0,
              quickServe: 0,
            },
            // Preserve market dynamics (handle migration from old field names)
            percentWhoWantIt: p.percentWhoWantIt ?? (p as any).percentWhoWillPay,
            percentWhoCanUseIt: p.percentWhoCanUseIt ?? (p as any).percentWhoWillUse,
            complexity: p.complexity,
            currentAttachRate: p.currentAttachRate,
            backbookMultiplier: p.backbookMultiplier,
            marketRelevance: p.marketRelevance ? [...p.marketRelevance] : undefined,
            competitors: p.competitors, // Preserve competitors
          }));
          
          return {
            currentMix: resetCurrentMix,
            newMix: resetNewMix,
            products: resetProducts,
          };
        }),
      importState: (state: AppState) => set(state),
      
      saveVersion: (name: string, id?: string) => {
        set((state: Store) => {
          // Deep clone products to ensure all properties (category, name, notes, fitBySegment, market dynamics, competitors) are preserved
          const productsToSave = state.products.map((p: Product) => ({
            id: p.id,
            category: p.category,
            name: p.name,
            notes: p.notes || '',
            fitBySegment: { ...p.fitBySegment },
            percentWhoWantIt: p.percentWhoWantIt,
            percentWhoCanUseIt: p.percentWhoCanUseIt,
            complexity: p.complexity,
            currentAttachRate: p.currentAttachRate,
            backbookMultiplier: p.backbookMultiplier,
            marketRelevance: p.marketRelevance ? [...p.marketRelevance] : undefined,
            competitors: p.competitors ? { ...p.competitors } : undefined,
          }));
          
          const versionToSave: SavedVersion = {
            id: id || generateId(),
            name,
            timestamp: Date.now(),
            state: {
              currentMix: { ...state.currentMix },
              newMix: { ...state.newMix },
              products: productsToSave,
            },
          };
          
          let updatedVersions: SavedVersion[];
          if (id) {
            // Update existing version
            updatedVersions = state.savedVersions.map(v => 
              v.id === id ? versionToSave : v
            );
          } else {
            // Create new version
            updatedVersions = [...state.savedVersions, versionToSave];
          }
          
          saveVersions(updatedVersions);
          return { savedVersions: updatedVersions };
        });
      },
      
      loadVersion: (id: string) => {
        const versions = loadVersions();
        const version = versions.find((v: SavedVersion) => v.id === id);
        if (version && version.state) {
          // Ensure products are fully loaded with all properties
          const productsToLoad = (version.state.products || []).map((p: any) => ({
            id: p.id || generateId(),
            category: p.category || '',
            name: p.name || '',
            notes: p.notes || '',
            fitBySegment: p.fitBySegment || {
              casual: 0,
              upscaleCasual: 0,
              fineDining: 0,
              bar: 0,
              quickServe: 0,
            },
        // Handle migration from old field names
        percentWhoWantIt: p.percentWhoWantIt ?? (p as any).percentWhoWillPay,
        percentWhoCanUseIt: p.percentWhoCanUseIt ?? (p as any).percentWhoWillUse,
        complexity: p.complexity,
        currentAttachRate: p.currentAttachRate,
        marketRelevance: p.marketRelevance ? [...p.marketRelevance] : undefined,
          }));
          
          set({
            currentMix: version.state.currentMix || DEFAULT_CURRENT_MIX,
            newMix: version.state.newMix || DEFAULT_NEW_MIX,
            products: productsToLoad,
            savedVersions: versions, // Keep versions in sync
          });
        }
      },
      
      deleteVersion: (id: string) => {
        set((state: Store) => {
          const updatedVersions = state.savedVersions.filter((v: SavedVersion) => v.id !== id);
          saveVersions(updatedVersions);
          return { savedVersions: updatedVersions };
        });
      },
    }),
    {
      name: "product-penetration-storage",
      onRehydrateStorage: () => (state: any, error: any) => {
        if (error) {
          console.error('Error rehydrating state:', error);
          // Clear localStorage on error and use defaults
          try {
            localStorage.removeItem('product-penetration-storage');
          } catch (e) {
            console.error('Error clearing localStorage:', e);
          }
          return {
            currentMix: DEFAULT_CURRENT_MIX,
            newMix: DEFAULT_NEW_MIX,
            products: createInitialProducts(),
            countryTotals: {} as Record<RegionKey, number>,
          };
        }
        
        if (state) {
          // Check if state needs migration
          const needsMigration = 
            // Old SegmentMix format (no regions at all)
            (state.currentMix && typeof state.currentMix === 'object' && 'casual' in state.currentMix && !('uk' in state.currentMix)) ||
            // Old RegionMix format (has old regions like benelux, row but not new ones like belgium)
            (state.currentMix && state.currentMix.uk && !state.currentMix.belgium);
          
          if (needsMigration) {
            // Migrate from old format
            const migrated = migrateToRegionMix(state);
            if (migrated) {
              // Ensure products are validated and preserved during migration
              const validatedProducts = (state.products || []).map((p: any) => ({
                id: p.id || generateId(),
                category: p.category || '',
                name: p.name || '',
                notes: p.notes || '',
                fitBySegment: p.fitBySegment || {
                  casual: 0,
                  upscaleCasual: 0,
                  fineDining: 0,
                  bar: 0,
                  quickServe: 0,
                },
                // Handle migration from old field names
                percentWhoWantIt: p.percentWhoWantIt ?? p.percentWhoWillPay,
                percentWhoCanUseIt: p.percentWhoCanUseIt ?? p.percentWhoWillUse,
                complexity: p.complexity,
                currentAttachRate: p.currentAttachRate,
                marketRelevance: p.marketRelevance ? [...p.marketRelevance] : undefined,
                competitors: p.competitors || undefined,
              }));
              
              return {
                ...migrated,
                products: validatedProducts.length > 0 ? validatedProducts : (migrated.products || createInitialProducts()),
                countryTotals: state.countryTotals || ({} as Record<RegionKey, number>),
              };
            }
          } else if (state.currentMix && !state.currentMix.belgium) {
            // Invalid state structure, reset to defaults but preserve products
            const validatedProducts = (state.products || []).map((p: any) => ({
              id: p.id || generateId(),
              category: p.category || '',
              name: p.name || '',
              notes: p.notes || '',
              fitBySegment: p.fitBySegment || {
                casual: 0,
                upscaleCasual: 0,
                fineDining: 0,
                bar: 0,
                quickServe: 0,
              },
              // Handle migration from old field names
              percentWhoWantIt: p.percentWhoWantIt ?? (p as any).percentWhoWillPay,
              percentWhoCanUseIt: p.percentWhoCanUseIt ?? (p as any).percentWhoWillUse,
              complexity: p.complexity,
              currentAttachRate: p.currentAttachRate,
              backbookMultiplier: p.backbookMultiplier,
              marketRelevance: p.marketRelevance ? [...p.marketRelevance] : undefined,
              competitors: p.competitors || undefined,
            }));
            
            return {
              currentMix: DEFAULT_CURRENT_MIX,
              newMix: DEFAULT_NEW_MIX,
              products: validatedProducts.length > 0 ? validatedProducts : createInitialProducts(),
              countryTotals: state.countryTotals || ({} as Record<RegionKey, number>),
            };
          } else if (state.currentMix && state.currentMix.belgium) {
            // If countryTotals exist, preserve the currentMix (it's from CSV and should be permanent)
            // Only update if we have old defaults AND no countryTotals (meaning it's truly old data)
            const hasCountryTotals = state.countryTotals && Object.keys(state.countryTotals).length > 0;
            
            if (!hasCountryTotals) {
              // Check if currentMix has old default values (all 20s for every region)
              // This would indicate old defaults that should be updated to new CSV-based defaults
              const currentMixHasOldDefaults = REGION_KEYS.every(region => {
                const mix = state.currentMix[region];
                if (!mix) return false;
                return mix.casual === 20 && mix.upscaleCasual === 20 && mix.fineDining === 20 && 
                       mix.bar === 20 && mix.quickServe === 20;
              });
              
              // Check if newMix has old default values (15, 15, 10, 10, 50 for every region)
              const newMixHasOldDefaults = REGION_KEYS.every(region => {
                const mix = state.newMix?.[region];
                if (!mix) return false;
                return mix.casual === 15 && mix.upscaleCasual === 15 && mix.fineDining === 10 && 
                       mix.bar === 10 && mix.quickServe === 50;
              });
              
              if (currentMixHasOldDefaults || newMixHasOldDefaults) {
                // Update to new CSV-based defaults (same values for both mixes)
                // Ensure products are validated and preserved
                const validatedProducts = (state.products || []).map((p: any) => ({
                  id: p.id || generateId(),
                  category: p.category || '',
                  name: p.name || '',
                  notes: p.notes || '',
                  fitBySegment: p.fitBySegment || {
                    casual: 0,
                    upscaleCasual: 0,
                    fineDining: 0,
                    bar: 0,
                    quickServe: 0,
                  },
                  // Handle migration from old field names
                  percentWhoWantIt: p.percentWhoWantIt ?? p.percentWhoWillPay,
                  percentWhoCanUseIt: p.percentWhoCanUseIt ?? p.percentWhoWillUse,
                  complexity: p.complexity,
                  currentAttachRate: p.currentAttachRate,
                  marketRelevance: p.marketRelevance ? [...p.marketRelevance] : undefined,
                  competitors: p.competitors || undefined,
                }));
                
                return {
                  ...state,
                  currentMix: currentMixHasOldDefaults ? DEFAULT_CURRENT_MIX : state.currentMix,
                  newMix: newMixHasOldDefaults ? DEFAULT_NEW_MIX : state.newMix,
                  products: validatedProducts.length > 0 ? validatedProducts : (state.products || createInitialProducts()),
                  // Ensure lock state exists - lock Current Mix if countryTotals exist
                  currentMixLocked: hasCountryTotals || (state.currentMixLocked ?? false),
                  newMixLocked: state.newMixLocked ?? false,
                  countryTotals: state.countryTotals || ({} as Record<RegionKey, number>),
                };
              }
            }
          }
        }
        
        // Final validation: ensure products exist and have all required fields, and lock state is correct
        if (state) {
          const hasCountryTotals = state.countryTotals && Object.keys(state.countryTotals).length > 0;
          const shouldLockCurrentMix = hasCountryTotals || (state.currentMixLocked ?? false);
          
          // Validate products exist and have all required fields
          const validatedProducts = (state.products || []).map((p: any) => ({
            id: p.id || generateId(),
            category: p.category || '',
            name: p.name || '',
            notes: p.notes || '',
            fitBySegment: p.fitBySegment || {
              casual: 0,
              upscaleCasual: 0,
              fineDining: 0,
              bar: 0,
              quickServe: 0,
            },
            // Handle migration from old field names
            percentWhoWantIt: p.percentWhoWantIt ?? (p as any).percentWhoWillPay,
            percentWhoCanUseIt: p.percentWhoCanUseIt ?? (p as any).percentWhoWillUse,
            complexity: p.complexity,
            currentAttachRate: p.currentAttachRate,
            backbookMultiplier: p.backbookMultiplier,
            marketRelevance: p.marketRelevance ? [...p.marketRelevance] : undefined,
            competitors: p.competitors || undefined,
          }));
          
          // Check if lock state or products need updating
          const needsLockUpdate = shouldLockCurrentMix !== (state.currentMixLocked ?? false);
          const needsProductUpdate = state.products && state.products.some((original: any, i: number) => {
            const validated = validatedProducts[i];
            return !original || !original.category || !original.name || !original.fitBySegment || !validated;
          });
          
          if (needsLockUpdate || needsProductUpdate) {
            return {
              ...state,
              currentMixLocked: shouldLockCurrentMix,
              newMixLocked: state.newMixLocked ?? false,
              products: validatedProducts.length > 0 ? validatedProducts : (state.products || createInitialProducts()),
              countryTotals: state.countryTotals || ({} as Record<RegionKey, number>),
            };
          }
        }
        
        return state;
      },
    }
  )
);

