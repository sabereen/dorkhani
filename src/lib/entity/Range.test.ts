import { Page } from '@ghoran/entity'
import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import { describe, expect, it } from 'vitest'
import type { KhatmPart } from './KhatmPart'
import { page_toRange } from './Page'
import { QuranRange } from './Range'

function part(start: number, end: number) {
	return { start, end } as KhatmPart
}

describe('page-weighted Quran ranges', () => {
	it('weights partial, whole and multiple pages', () => {
		const firstPage = Page.get(0)
		const firstTwoPages = new QuranRange(0, Page.get(1).lastAyahIndex + 1)

		expect(new QuranRange(0, 0).getPageCount()).toBe(0)
		expect(new QuranRange(0, 1).getPageCount()).toBe(1 / firstPage.ayahCount)
		expect(page_toRange(firstPage).getPageCount()).toBe(1)
		expect(firstTwoPages.getPageCount()).toBe(2)
		expect(new QuranRange(0, COUNT_OF_AYAHS).getCoveragePercent()).toBe(1)
	})

	it('measures filled subranges by page weight', () => {
		const firstPageRange = page_toRange(Page.get(0))

		expect(firstPageRange.getFillPercent([])).toBe(0)
		expect(firstPageRange.getFillPercent([part(0, 1)])).toBe(14.29)
		expect(firstPageRange.getFillPercent([part(0, 1), part(2, 3)])).toBe(28.57)
		expect(firstPageRange.getFillPercent([part(0, firstPageRange.end)])).toBe(100)
	})
})
