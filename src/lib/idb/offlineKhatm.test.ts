import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import type { OfflineKhatmPartRecord } from '$lib/contracts/domain'
import {
	calculateOfflineKhatmProgress,
	offlineKhatmRangesOverlap,
} from './offlineKhatm'
import { describe, expect, it } from 'vitest'

function part(start: number, end: number): OfflineKhatmPartRecord {
	return {
		id: `${start}:${end}`,
		khatmId: 'test',
		roundNumber: 1,
		start,
		end,
		created: new Date(0),
	}
}

describe('offline khatm progress', () => {
	it('calculates an empty and a completed round', () => {
		expect(calculateOfflineKhatmProgress([])).toEqual({ versesRead: 0, pageProgress: 0 })
		expect(calculateOfflineKhatmProgress([part(0, COUNT_OF_AYAHS)])).toEqual({
			versesRead: COUNT_OF_AYAHS,
			pageProgress: 100,
		})
	})

	it('merges adjacent ranges without double counting', () => {
		const progress = calculateOfflineKhatmProgress([part(0, 10), part(10, 25)])
		expect(progress.versesRead).toBe(25)
		expect(progress.pageProgress).toBeGreaterThan(0)
		expect(progress.pageProgress).toBeLessThan(100)
	})

	it('detects overlap but allows touching boundaries', () => {
		expect(offlineKhatmRangesOverlap(part(0, 10), part(9, 12))).toBe(true)
		expect(offlineKhatmRangesOverlap(part(0, 10), part(10, 12))).toBe(false)
	})
})
