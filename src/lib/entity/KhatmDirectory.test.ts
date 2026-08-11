import { describe, expect, it } from 'vitest'
import { khatmDirectory_parseSearchParams } from './KhatmDirectory'

describe('khatm directory search params', () => {
	it.each(['free', 'page', 'hizbQuarter', 'surah', 'juz', 'ayah'])(
		'accepts the %s range type',
		(rangeType) => {
			const result = khatmDirectory_parseSearchParams(new URLSearchParams({ rangeType }))
			expect(result.rangeType).toBe(rangeType)
		},
	)

	it('normalizes supported filters and trims the search query', () => {
		const params = new URLSearchParams({
			view: 'progress',
			q: '  سلامتی  ',
			rangeType: 'surah',
			cursor: 'opaque-cursor',
		})

		expect(khatmDirectory_parseSearchParams(params)).toEqual({
			view: 'progress',
			q: 'سلامتی',
			rangeType: 'surah',
			cursor: 'opaque-cursor',
		})
	})

	it('falls back to the recent unfiltered directory for unsupported values', () => {
		const params = new URLSearchParams({ view: 'unknown', rangeType: 'unknown', q: '   ' })

		expect(khatmDirectory_parseSearchParams(params)).toEqual({
			view: 'recent',
			q: '',
			rangeType: undefined,
			cursor: undefined,
		})
	})
})
