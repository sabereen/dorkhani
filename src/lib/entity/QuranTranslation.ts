import * as m from '$lib/paraglide/messages.js'

export type QuranTranslationId = 'ansarian' | 'makarem' | 'gharaati'

export type QuranTranslationSource = {
	id: QuranTranslationId
	sourceLocale: 'fa' | 'ar' | 'en'
	label: () => string
}

export const quranTranslationRegistry: readonly QuranTranslationSource[] = [
	{ id: 'ansarian', sourceLocale: 'fa', label: m.translation_ansarian },
	{ id: 'makarem', sourceLocale: 'fa', label: m.translation_makarem },
	{ id: 'gharaati', sourceLocale: 'fa', label: m.translation_gharaati },
]

export function getQuranTranslation(id: QuranTranslationId) {
	return quranTranslationRegistry.find((translation) => translation.id === id)!
}
