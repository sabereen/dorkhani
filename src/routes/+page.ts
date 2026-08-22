import type { PageLoad } from './$types'
import type { HomeData } from '$lib/contracts/api'
import { loadApi } from '$lib/utility/request'
import { browser } from '$app/environment'
import { isInstalledApp } from '$lib/config/installedApp'

export const load: PageLoad = async ({ fetch, url }) => {
	try {
		return await loadApi<HomeData>('/home', { fetch, origin: url.origin })
	} catch (cause) {
		if (!browser || !isInstalledApp()) throw cause
		return {
			khatms: [],
			featuredKhatms: [],
			showcase: [],
			zekrList: [],
			statistics: { totals: { recitedAyahs: 0, completedRounds: 0 }, daily: [] },
		} satisfies HomeData
	}
}
