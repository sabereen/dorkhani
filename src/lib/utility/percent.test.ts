import { describe, expect, it } from 'vitest'
import { roundPercent } from './percent'

describe('roundPercent', () => {
	it('rounds to two decimal places', () => {
		expect(roundPercent(12.344, false)).toBe(12.34)
		expect(roundPercent(12.345, false)).toBe(12.35)
	})

	it('keeps partial progress visibly between zero and completion', () => {
		expect(roundPercent(0.004, false)).toBe(0.01)
		expect(roundPercent(99.999, false)).toBe(99.99)
		expect(roundPercent(100, true)).toBe(100)
		expect(roundPercent(0, true)).toBe(100)
		expect(roundPercent(0, false)).toBe(0)
	})
})
