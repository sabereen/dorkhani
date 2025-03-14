import { Surah as GSurah } from '@ghoran/entity'

export class Surah extends GSurah {
	toRange() {
		return {
			start: this.firstAyahIndex,
			end: this.lastAyahIndex,
			title: this.name,
		}
	}
}
