import { describe, it, expect } from 'vitest'
import { validateMix, computePenetration, computeAttach, clampPercent, roundToOneDecimal } from '../utils/calculations'
import type { SegmentMix, Product, RegionMix } from '../types'

describe('calculations', () => {
  describe('validateMix', () => {
    it('should validate a mix that sums to 100', () => {
      const mix: SegmentMix = {
        casual: 20,
        upscaleCasual: 20,
        fineDining: 20,
        bar: 20,
        quickServe: 20,
      }
      const result = validateMix(mix)
      expect(result.isValid).toBe(true)
      expect(result.total).toBe(100)
    })

    it('should invalidate a mix that does not sum to 100', () => {
      const mix: SegmentMix = {
        casual: 20,
        upscaleCasual: 20,
        fineDining: 20,
        bar: 20,
        quickServe: 10,
      }
      const result = validateMix(mix)
      expect(result.isValid).toBe(false)
      expect(result.total).toBe(90)
    })

    it('should allow tolerance of 0.1', () => {
      const mix: SegmentMix = {
        casual: 20,
        upscaleCasual: 20,
        fineDining: 20,
        bar: 20,
        quickServe: 19.95,
      }
      const result = validateMix(mix)
      expect(result.isValid).toBe(true)
    })
  })

  describe('computePenetration', () => {
    it('should calculate penetration correctly', () => {
      const product: Product = {
        id: '1',
        category: 'Test Category',
        name: 'Test Product',
        fitBySegment: {
          casual: 50,
          upscaleCasual: 30,
          fineDining: 20,
          bar: 10,
          quickServe: 40,
        },
      }
      const currentMix: RegionMix = {
        belgium: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        canada: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        switzerland: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        germany: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        france: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        luxembourg: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        malta: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        netherlands: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        uk: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        us: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
      }
      // Expected: (0.2 * 0.5) + (0.2 * 0.3) + (0.2 * 0.2) + (0.2 * 0.1) + (0.2 * 0.4)
      // = 0.1 + 0.06 + 0.04 + 0.02 + 0.08 = 0.3 = 30%
      const result = computePenetration(product, currentMix)
      expect(result).toBeCloseTo(30, 1)
    })

    it('should return 0 when all fits are 0', () => {
      const product: Product = {
        id: '1',
        category: 'Test Category',
        name: 'Test Product',
        fitBySegment: {
          casual: 0,
          upscaleCasual: 0,
          fineDining: 0,
          bar: 0,
          quickServe: 0,
        },
      }
      const currentMix: RegionMix = {
        belgium: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        canada: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        switzerland: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        germany: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        france: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        luxembourg: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        malta: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        netherlands: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        uk: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
        us: { casual: 20, upscaleCasual: 20, fineDining: 20, bar: 20, quickServe: 20 },
      }
      const result = computePenetration(product, currentMix)
      expect(result).toBe(0)
    })
  })

  describe('computeAttach', () => {
    it('should calculate attach correctly', () => {
      const product: Product = {
        id: '1',
        category: 'Test Category',
        name: 'Test Product',
        fitBySegment: {
          casual: 50,
          upscaleCasual: 30,
          fineDining: 20,
          bar: 10,
          quickServe: 40,
        },
      }
      const newMix: RegionMix = {
        belgium: { casual: 15, upscaleCasual: 15, fineDining: 10, bar: 10, quickServe: 50 },
        canada: { casual: 15, upscaleCasual: 15, fineDining: 10, bar: 10, quickServe: 50 },
        switzerland: { casual: 15, upscaleCasual: 15, fineDining: 10, bar: 10, quickServe: 50 },
        germany: { casual: 15, upscaleCasual: 15, fineDining: 10, bar: 10, quickServe: 50 },
        france: { casual: 15, upscaleCasual: 15, fineDining: 10, bar: 10, quickServe: 50 },
        luxembourg: { casual: 15, upscaleCasual: 15, fineDining: 10, bar: 10, quickServe: 50 },
        malta: { casual: 15, upscaleCasual: 15, fineDining: 10, bar: 10, quickServe: 50 },
        netherlands: { casual: 15, upscaleCasual: 15, fineDining: 10, bar: 10, quickServe: 50 },
        uk: { casual: 15, upscaleCasual: 15, fineDining: 10, bar: 10, quickServe: 50 },
        us: { casual: 15, upscaleCasual: 15, fineDining: 10, bar: 10, quickServe: 50 },
      }
      // Expected: (0.15 * 0.5) + (0.15 * 0.3) + (0.1 * 0.2) + (0.1 * 0.1) + (0.5 * 0.4)
      // = 0.075 + 0.045 + 0.02 + 0.01 + 0.2 = 0.35 = 35%
      const result = computeAttach(product, newMix)
      expect(result).toBeCloseTo(35, 1)
    })
  })

  describe('clampPercent', () => {
    it('should clamp values to 0-100', () => {
      expect(clampPercent(-10)).toBe(0)
      expect(clampPercent(0)).toBe(0)
      expect(clampPercent(50)).toBe(50)
      expect(clampPercent(100)).toBe(100)
      expect(clampPercent(150)).toBe(100)
    })
  })

  describe('roundToOneDecimal', () => {
    it('should round to one decimal place', () => {
      expect(roundToOneDecimal(10.123)).toBe(10.1)
      expect(roundToOneDecimal(10.156)).toBe(10.2)
      expect(roundToOneDecimal(10.15)).toBe(10.2)
      expect(roundToOneDecimal(10.1)).toBe(10.1)
    })
  })
})

