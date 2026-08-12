import { describe, expect, it } from 'vitest'
import type { KhatmData } from './KhatmData'
import { Khatm } from './Khatm.svelte'

function khatmData(overrides: Partial<KhatmData> = {}): KhatmData {
	return {
		id: 12,
		title: 'ختم آزمایشی',
		description: '',
		rangeType: 'free',
		versesRead: 100,
		pageProgress: 12.345,
		private: false,
		accessToken: null,
		created: new Date('2026-08-11T00:00:00Z'),
		endDate: null,
		status: 'inProgress',
		reviewStatus: 'approved',
		roundNumber: 1,
		seriesId: null,
		...overrides,
	}
}

describe('Khatm page progress', () => {
	it('uses persisted page progress and semantic rounding', () => {
		const khatm = Khatm.fromPlain(khatmData())

		expect(khatm.progress).toBe(0.12345)
		expect(khatm.percent).toBe(12.35)
		expect(Khatm.fromPlain(khatmData({ pageProgress: 99.999 })).percent).toBe(99.99)
		expect(
			Khatm.fromPlain(khatmData({ pageProgress: 99.999, status: 'completed' })).percent,
		).toBe(100)
	})

	it('normalizes legacy IndexedDB snapshots without page progress to zero', () => {
		const legacy = { ...khatmData() } as Omit<KhatmData, 'pageProgress'> & {
			pageProgress?: number
		}
		delete legacy.pageProgress

		expect(Khatm.fromPlain(legacy as KhatmData).percent).toBe(0)
	})
})
