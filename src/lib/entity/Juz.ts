import { Ayah, Page, Surah } from '@ghoran/entity'
import { juzList } from '@ghoran/metadata'
import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'

export class Juz {
	readonly index: number

	constructor(index: number) {
		this.index = index
	}

	static getAll() {
		return juzList.map((_, index) => new Juz(index))
	}

	get number() {
		return this.index + 1
	}

	get firstAyahIndex() {
		return juzList[this.index]
	}

	get firstAyah() {
		return Ayah.get(this.firstAyahIndex)
	}

	get lastAyahIndex(): number {
		return (this.next?.firstAyahIndex ?? COUNT_OF_AYAHS) - 1
	}

	get lastAyah() {
		return Ayah.get(this.lastAyahIndex)
	}

	get next(): Juz | null {
		if (this.index >= 29) return null
		return new Juz(this.index + 1)
	}

	get ayahCount() {
		return this.lastAyahIndex - this.firstAyahIndex + 1
	}

	getSurahList() {
		const list: Surah[] = []
		let surah: Surah | null = this.firstAyah.surah
		do {
			list.push(surah)
			surah = surah?.next
		} while (surah?.firstAyah.juzIndex === this.index)

		return list
	}

	getPages() {
		const list: Page[] = []
		for (
			let page = this.firstAyah.page as Page | null;
			page?.firstAyah.juzIndex === this.index;
			page = page.next
		) {
			list.push(page)
		}
		return list
	}
}
