import { Ayah, HizbQuarter, Page, Surah } from '@ghoran/entity'
import { COUNT_OF_PAGES } from '@ghoran/metadata/constants'
import { page_toRange } from './Page'
import { surah_getName, surah_toRange } from './Surah'
import type { KhatmPart } from './KhatmPart'
import { splitInterval } from '$lib/utility/splitIntervals'
import { hizbQuarter_toRange } from './HizbQuarter'
import { ayah_getExternalLink } from './Ayah'
import type { RangeType } from '@prisma-client'
import type { Khatm } from './Khatm.svelte'
import { roundPercent } from '$lib/utility/percent'
import { formatNumber } from '$lib/i18n/format'
import * as m from '$lib/paraglide/messages.js'

export class QuranRange {
	start: number
	end: number
	title: string

	constructor(start: number, end: number, title?: string) {
		this.start = start
		this.end = end
		this.title = title || ''
	}

	static fromRangeParam(rangeParam: string, title?: string) {
		const regex = /^(\d\d?\d?):(\d\d?\d?)-(\d\d?\d?):(\d\d?\d?)$/
		const result = regex.exec(rangeParam)
		if (!result) return null
		const [, startSurahNumber, startAyahNumber, endSurahNumber, endAyahNumber] = result
		const start = Ayah.getBySurahNumber(+startSurahNumber, +startAyahNumber)
		const last = Ayah.getBySurahNumber(+endSurahNumber, +endAyahNumber)
		if (!start || !last) return null
		return new QuranRange(start.index, last.index + 1, title)
	}

	get startAyah() {
		return Ayah.get(this.start)
	}

	get endAyah() {
		return Ayah.get(this.end)
	}

	get lastAyah() {
		return Ayah.get(this.end - 1)
	}

	get length() {
		return this.end - this.start
	}

	get externalLink() {
		if (this.matchRangeType('ayah')) return ayah_getExternalLink(this.startAyah)
		const start = `${this.startAyah.surahNumber}:${this.startAyah.number}`
		const end = `${this.lastAyah.surahNumber}:${this.lastAyah.number}`
		return `https://quran.com/fa/${start}-${end}`
	}

	getLink(khatm: Khatm) {
		const url = new URL(khatm.link)
		url.pathname += '/' + this.toRangeParam()
		return url.href
	}

	toRangeParam() {
		return `${this.startAyah.key}-${this.lastAyah.key}`
	}

	matchRangeType(type: RangeType): boolean {
		const firstAyah = this.startAyah
		const lastAyah = this.lastAyah

		switch (type) {
			case 'free':
				return true
			case 'ayah':
				return firstAyah === lastAyah
			case 'surah':
				return (
					firstAyah.surahNumber === lastAyah.surahNumber &&
					firstAyah.isFirstOfSurah &&
					lastAyah.isLastOfSurah
				)
			case 'page':
				return (
					firstAyah.pageIndex === lastAyah.pageIndex &&
					firstAyah.isFirstOfPage &&
					lastAyah.isLastOfPage
				)
			case 'hizbQuarter':
				return (
					firstAyah.hizbQuarterIndex === lastAyah.hizbQuarterIndex &&
					firstAyah.hizbQuarter.firstAyah === firstAyah &&
					firstAyah.hizbQuarter.lastAyah === lastAyah
				)
			case 'juz':
				return (
					firstAyah.juzIndex === lastAyah.juzIndex && firstAyah.isFirstOfJuz && lastAyah.isLastOfJuz
				)
		}
	}

	getPages() {
		const list: { page: Page; range: QuranRange }[] = []

		let page: Page | null = this.startAyah.page
		do {
			const range = page_toRange(page)
			range.start = Math.max(range.start, this.start)
			range.end = Math.min(range.end, this.end)

			list.push({ page, range })

			page = page.next
		} while (page && page.firstAyah.index < this.end)

		return list
	}

	getPageCount() {
		if (this.end <= this.start) return 0

		const startPage = this.startAyah.page
		const lastPage = this.lastAyah.page
		const betweenPagesCount = lastPage.index - startPage.index - 1

		const startFraction = 1 - (this.start - startPage.firstAyahIndex) / startPage.ayahCount
		const endFraction = (this.end - lastPage.firstAyahIndex) / lastPage.ayahCount

		return betweenPagesCount + startFraction + endFraction
	}

	getCoveragePercent() {
		return this.getPageCount() / COUNT_OF_PAGES
	}

	getHizbQuarters() {
		const list: { hizbQuarter: HizbQuarter; range: QuranRange }[] = []

		let hizbQuarter: HizbQuarter | null = this.startAyah.hizbQuarter
		do {
			const range = hizbQuarter_toRange(hizbQuarter)
			range.start = Math.max(range.start, this.start)
			range.end = Math.min(range.end, this.end)

			list.push({ hizbQuarter, range })

			hizbQuarter = hizbQuarter.next
		} while (hizbQuarter && hizbQuarter.firstAyah.index < this.end)

		return list
	}

	getSurahs() {
		const list: { surah: Surah; range: QuranRange }[] = []

		let surah: Surah | null = this.startAyah.surah
		do {
			const range = surah_toRange(surah)

			range.start = Math.max(range.start, this.start)
			range.end = Math.min(range.end, this.end)

			list.push({ surah, range })

			surah = surah.next
		} while (surah && surah.firstAyah.index < this.end)

		return list
	}

	divideByKahtmParts(parts: KhatmPart[]) {
		const ranges = splitInterval(this, parts)

		const result = ranges.map((r) => ({
			range: new QuranRange(r.start, r.end, ''),
			khatmPart: r.from == null ? null : parts[r.from],
		}))

		return result
	}

	getFillPercent(parts: KhatmPart[]) {
		if (this.length <= 0) return 0

		const subranges = this.divideByKahtmParts(parts).filter((p) => p.khatmPart)
		const fillCount = subranges.reduce((sum, { range }) => sum + range.length, 0)
		if (fillCount === this.length) return 100

		const filledPageCount = subranges.reduce((sum, { range }) => sum + range.getPageCount(), 0)
		return roundPercent((100 * filledPageCount) / this.getPageCount(), false)
	}

	getTitle() {
		const startSurahName = surah_getName(this.startAyah.surah)
		const lastSurahName = surah_getName(this.lastAyah.surah)

		if (
			this.startAyah.isFirstOfSurah &&
			this.lastAyah.isLastOfSurah &&
			startSurahName === lastSurahName
		) {
			return m.range_surah_title({ surah: startSurahName })
		}

		const from = this.startAyah.isFirstOfSurah
			? m.range_start_surah({ surah: startSurahName })
			: m.range_ayah_in_surah({ ayah: formatNumber(this.startAyah.number), surah: startSurahName })

		const to = this.lastAyah.isLastOfSurah
			? m.range_end_surah({ surah: lastSurahName })
			: m.range_ayah_in_surah({ ayah: formatNumber(this.lastAyah.number), surah: lastSurahName })

		return m.range_from_to({ from, to })
	}

	getTitleSurahOrinted() {
		if (this.startAyah.surah !== this.lastAyah.surah) return this.getTitle()
		const surahName = surah_getName(this.startAyah.surah)

		if (!this.startAyah.isFirstOfSurah && !this.lastAyah.isLastOfSurah) {
			return m.range_surah_between({
				surah: surahName,
				start: formatNumber(this.startAyah.number),
				end: formatNumber(this.lastAyah.number),
			})
		} else if (!this.startAyah.isFirstOfSurah) {
			return m.range_surah_from({ surah: surahName, start: formatNumber(this.startAyah.number) })
		} else if (!this.lastAyah.isLastOfSurah) {
			return m.range_surah_to({ surah: surahName, end: formatNumber(this.lastAyah.number) })
		} else {
			return surahName
		}
	}
}
