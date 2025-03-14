import { Juz as GJuz } from '@ghoran/entity'

export class Juz extends GJuz {
	toRange() {
		return {
			start: this.firstAyahIndex,
			end: this.lastAyahIndex,
			title: `جزء ${this.number}`,
		}
	}
}
