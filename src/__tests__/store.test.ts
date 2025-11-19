import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../store'
import { DEFAULT_CURRENT_MIX, DEFAULT_NEW_MIX } from '../types'

describe('store', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useStore.getState().resetToDefaults()
  })

  it('should initialize with default values', () => {
    const state = useStore.getState()
    expect(state.currentMix).toEqual(DEFAULT_CURRENT_MIX)
    expect(state.newMix).toEqual(DEFAULT_NEW_MIX)
    expect(state.products.length).toBeGreaterThan(0)
  })

  it('should update current mix segment', () => {
    const { updateCurrentMixSegment } = useStore.getState()
    updateCurrentMixSegment('uk', 'casual', 25)
    
    const state = useStore.getState()
    expect(state.currentMix.uk.casual).toBe(25)
  })

  it('should update new mix segment', () => {
    const { updateNewMixSegment } = useStore.getState()
    updateNewMixSegment('uk', 'quickServe', 60)
    
    const state = useStore.getState()
    expect(state.newMix.uk.quickServe).toBe(60)
  })

  it('should add a product', () => {
    const { addProduct, products } = useStore.getState()
    const initialCount = products.length
    
    addProduct({
      category: 'Test Category',
      name: 'New Product',
      fitBySegment: {
        casual: 0,
        upscaleCasual: 0,
        fineDining: 0,
        bar: 0,
        quickServe: 0,
      },
    })
    
    const state = useStore.getState()
    expect(state.products.length).toBe(initialCount + 1)
    expect(state.products[state.products.length - 1].name).toBe('New Product')
  })

  it('should update a product', () => {
    const { products, updateProduct } = useStore.getState()
    const firstProduct = products[0]
    
    updateProduct(firstProduct.id, { name: 'Updated Name' })
    
    const state = useStore.getState()
    const updatedProduct = state.products.find(p => p.id === firstProduct.id)
    expect(updatedProduct?.name).toBe('Updated Name')
  })

  it('should delete a product', () => {
    const { products, deleteProduct } = useStore.getState()
    const initialCount = products.length
    const firstProduct = products[0]
    
    deleteProduct(firstProduct.id)
    
    const state = useStore.getState()
    expect(state.products.length).toBe(initialCount - 1)
    expect(state.products.find(p => p.id === firstProduct.id)).toBeUndefined()
  })

  it('should duplicate a product', () => {
    const { products, duplicateProduct } = useStore.getState()
    const initialCount = products.length
    const firstProduct = products[0]
    
    duplicateProduct(firstProduct.id)
    
    const state = useStore.getState()
    expect(state.products.length).toBe(initialCount + 1)
    const duplicated = state.products.find(p => p.name === firstProduct.name && p.id !== firstProduct.id)
    expect(duplicated).toBeDefined()
  })

  it('should reset to defaults', () => {
    const { updateCurrentMixSegment, addProduct, resetToDefaults } = useStore.getState()
    
    // Make some changes
    updateCurrentMixSegment('uk', 'casual', 30)
    addProduct({
      category: 'Test Category',
      name: 'Test Product',
      fitBySegment: {
        casual: 0,
        upscaleCasual: 0,
        fineDining: 0,
        bar: 0,
        quickServe: 0,
      },
    })
    
    // Reset
    resetToDefaults()
    
    const state = useStore.getState()
    expect(state.currentMix).toEqual(DEFAULT_CURRENT_MIX)
    expect(state.newMix).toEqual(DEFAULT_NEW_MIX)
    // Products should be reset to default count
    expect(state.products.length).toBeGreaterThan(0)
  })
})

