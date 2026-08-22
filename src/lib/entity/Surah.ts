import { Surah } from '@ghoran/entity'
import { QuranRange } from './Range'
import { getLocale } from '$lib/paraglide/runtime.js'

export function surah_toRange(surah: Surah) {
	return new QuranRange(surah.firstAyahIndex, surah.lastAyahIndex + 1, surah_getName(surah))
}

export function surah_getName(surah: Surah) {
	if (getLocale() === 'en') return surah.latinName
	if (getLocale() === 'ar') return surah.name
	const name = surah.name
	return name
		.replace('ال', '')
		.replace(/^[أإ]/, 'ا')
		.replace('ة', 'ه')
		.replace('ك', 'ک')
		.replace('إ', 'أ')
		.replace('رحمن', 'الرحمن')
}
