import quranTextHafs from '@ghoran/text/json/quran-text-hafs.json'
import translationAnsarian from '@ghoran/translation/json/fa/tanzil-ansarian.json'
import translationMakarem from '@ghoran/translation/json/fa/tanzil-makarem.json'
import translationGharaati from '@ghoran/translation/json/fa/tanzil-gharaati.json'
import type { AyahInfo } from '$lib/contracts/domain'
import type { QuranTranslationId } from '$lib/entity/QuranTranslation'

const translations = {
	ansarian: translationAnsarian,
	makarem: translationMakarem,
	gharaati: translationGharaati,
} satisfies Record<QuranTranslationId, string[]>

export function getOfflineAyahInfoRange(
	range: { start: number; end: number },
	translation: QuranTranslationId,
) {
	const result: AyahInfo[] = []
	for (let index = range.start; index < range.end; index++) {
		result.push({
			index,
			textHafs: quranTextHafs[index],
			textQPC1: '',
			textQPC2: '',
			translation: translations[translation][index],
		})
	}
	return result
}
