import { describe, expect, test } from 'vitest'
import { findNonOverlappingSubranges } from './findNonOverlappingSubranges'

describe('findNonOverlappingSubranges', () => {
	test('should works', () => {
		const ranges = [
			{ start: 1, end: 10 },
			{ start: 10, end: 20 },
			{ start: 20, end: 30 },
		]
		const parts = [{ start: 12, end: 15 }]
		const result = findNonOverlappingSubranges(parts, ranges)
		expect(result).toEqual([
			{ start: 1, end: 10 },
			{ start: 10, end: 12 },
			{ start: 15, end: 20 },
			{ start: 20, end: 30 },
		])
	})
})
