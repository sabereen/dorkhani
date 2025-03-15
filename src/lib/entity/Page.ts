import { Page as GPage } from '@ghoran/entity'

export class Page extends GPage {
	toRange() {
		return {
			start: this.firstAyahIndex,
			end: this.lastAyahIndex + 1,
			title: `صفحه ${this.number}`,
		}
	}
}
