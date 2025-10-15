import translationAnsarian from '@ghoran/translation/json/fa/tanzil-ansarian.json'
import translationMakarem from '@ghoran/translation/json/fa/tanzil-makarem.json'
import translationGharaati from '@ghoran/translation/json/fa/tanzil-gharaati.json'

import quranTextQPC1 from '@ghoran/text/json/quran-text-qpc-v1.json'
import quranTextQPC2 from '@ghoran/text/json/quran-text-qpc-v2.json'
import quranTextHafs from '@ghoran/text/json/quran-text-hafs.json'

export type AyahInfo = {
	index: number
	textQPC1: string
	textQPC2: string
	textHafs: string
	translation: string
}

const translationMap = {
	ansarian: translationAnsarian,
	makarem: translationMakarem,
	gharaati: translationGharaati,
}

export type Translation = keyof typeof translationMap

export function getAyahInfo(ayahIndex: number, translation: Translation) {
	const translationStrings = translationMap[translation] || translationAnsarian
	return {
		index: ayahIndex,
		textQPC1: quranTextQPC1[ayahIndex],
		textQPC2: quranTextQPC2[ayahIndex],
		textHafs: quranTextHafs[ayahIndex],
		translation: translationStrings[ayahIndex],
	}
}

export function getAyahInfoRange(range: { start: number; end: number }, translation: Translation) {
	const result: AyahInfo[] = []
	for (let i = range.start; i < range.end; i++) {
		result.push(getAyahInfo(i, translation))
	}
	return result
}
