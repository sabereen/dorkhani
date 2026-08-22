import type { AyahInfo } from '$lib/contracts/domain'
import { loadApi } from '$lib/utility/request'
import type { PageLoad } from './$types'
import { browser } from '$app/environment'

function storedTranslation() {
	if (!browser) return undefined
	try {
		const settings = JSON.parse(localStorage.getItem('app_v1_localSettings') || '{}')
		return typeof settings.translation === 'string' ? settings.translation : undefined
	} catch {
		return undefined
	}
}

export const load: PageLoad = ({ fetch, params, url }) =>
	loadApi<{ ayat: AyahInfo[]; rangeParam: string }>('/quran/range', {
		fetch,
		origin: url.origin,
		body: { range: params.range, translation: storedTranslation() },
	})
