import { Page } from '@ghoran/entity'
import { QuranRange } from './Range'

export function page_toRange(page: Page) {
	return new QuranRange(page.firstAyahIndex, page.lastAyahIndex + 1, `صفحه ${page.number}`)
}
