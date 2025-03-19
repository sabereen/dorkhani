import { Surah } from '@ghoran/entity'
import { QuranRange } from './Range'

export function surah_toRange(surah: Surah) {
	return new QuranRange(surah.firstAyahIndex, surah.lastAyahIndex + 1, surah_getName(surah))
}

export function surah_getName(surah: Surah) {
	const name = surah.name
	return name
		.replace('ال', '')
		.replace(/^[أإ]/, 'ا')
		.replace('ة', 'ه')
		.replace('ك', 'ک')
		.replace('إ', 'أ')
		.replace('رحمن', 'الرحمن')
}
