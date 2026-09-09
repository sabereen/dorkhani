import type { AyahInfo } from '$lib/contracts/domain'
import { loadApi } from '$lib/utility/request'
import type { PageLoad } from './$types'
import { browser } from '$app/environment'
import { settingsStore } from '$lib/storage/client'

function storedTranslation() {
	if (!browser) return undefined
	const settings = settingsStore.getOrDefault<Record<string, unknown>>('localSettings', {})
	return typeof settings.translation === 'string' ? settings.translation : undefined
}

export const load: PageLoad = ({ fetch, params, url }) =>
	loadApi<{ ayat: AyahInfo[]; rangeParam: string }>('/quran/range', {
		fetch,
		origin: url.origin,
		body: { range: params.range, translation: storedTranslation() },
	})
