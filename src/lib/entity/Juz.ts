import { Juz } from '@ghoran/entity'
import { QuranRange } from './Range'

export function juz_toRange(juz: Juz) {
	return new QuranRange(juz.firstAyahIndex, juz.lastAyahIndex + 1, `جزء ${juz.number}`)
}
