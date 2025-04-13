import { Ayah, HizbQuarter, Page, Surah } from '@ghoran/entity'
import { page_toRange } from './Page'
import { surah_getName, surah_toRange } from './Surah'
import type { KhatmPart } from './KhatmPart'
import { splitInterval } from '$lib/utility/splitIntervals'
import { hizbQuarter_toRange } from './HizbQuarter'
import { ayah_getExternalLink } from './Ayah'
import type { RangeType } from '@prisma/client'

export class QuranRange {
	start: number
	end: number
	title: string

	constructor(start: number, end: number, title?: string) {
		this.start = start
		this.end = end
		this.title = title || ''
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
		const subranges = this.divideByKahtmParts(parts).filter((p) => p.khatmPart)
		const fillCount = subranges.map(({ range }) => range.length).reduce((a, b) => a + b, 0)
		return +(100 * (fillCount / this.length)).toFixed(0)
	}

	getTitle() {
		const startSurahName = surah_getName(this.startAyah.surah)
		const lastSurahName = surah_getName(this.lastAyah.surah)

		if (
			this.startAyah.isFirstOfSurah &&
			this.lastAyah.isLastOfSurah &&
			startSurahName === lastSurahName
		) {
			return `سوره‌ی ${startSurahName}`
		}

		const from = this.startAyah.isFirstOfSurah
			? `ابتدای ${startSurahName}`
			: `${this.startAyah.number} ${startSurahName}`

		const to = this.lastAyah.isLastOfSurah
			? `انتهای ${lastSurahName}`
			: `${this.endAyah.number} ${lastSurahName}`

		return `از ${from} تا ${to}`
	}

	getTitleSurahOrinted() {
		if (this.startAyah.surah !== this.lastAyah.surah) return this.getTitle()
		const surahName = surah_getName(this.startAyah.surah)

		if (!this.startAyah.isFirstOfSurah && !this.lastAyah.isLastOfSurah) {
			return `${surahName} (از آیه ${this.startAyah.number} تا ${this.endAyah.number})`
		} else if (!this.startAyah.isFirstOfSurah) {
			return `${surahName} (از آیه ${this.startAyah.number})`
		} else if (!this.lastAyah.isLastOfSurah) {
			return `${surahName} (تا آیه ${this.endAyah.number})`
		} else {
			return surahName
		}
	}
}
