import { Ayah, Page, Surah } from '@ghoran/entity'
import { page_toRange } from './Page'
import { surah_getName, surah_toRange } from './Surah'
import type { KhatmPart } from './KhatmPart'
import { splitInterval } from '$lib/utility/splitIntervals'

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
		return this.end - this.start + 1
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

	getSurahs() {
		const list: { surah: Surah; range: QuranRange }[] = []

		let surah: Surah | null = this.startAyah.surah
		do {
			const range = surah_toRange(surah)

			if (range.start < this.start && range.end > this.end) {
				range.start = this.start
				range.end = this.end
				range.title += ` (از آیه ${this.startAyah.ayahNumber} تا ${this.endAyah.ayahNumber})`
			} else if (range.start < this.start) {
				range.start = this.start
				range.title += ` (از آیه ${this.startAyah.ayahNumber})`
			} else if (range.end > this.end) {
				range.end = this.end
				range.title += ` (تا آیه ${this.endAyah.ayahNumber})`
			}

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

	getTitle() {
		const startSurahName = surah_getName(this.startAyah.surah)
		const lastSurahName = surah_getName(this.lastAyah.surah)

		if (this.startAyah.isFirstOfSurah && this.lastAyah.isLastOfSurah) {
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
