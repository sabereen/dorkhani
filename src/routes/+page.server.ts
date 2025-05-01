import {
	appSettings_store,
	appSettingsService_getStaleShowcaseWhileRevalidate,
} from '$service/appSettings'
import { khatmService_getPublicList } from '$service/khatm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	let khatms
	if (appSettings_store.config.autoShowcase) {
		khatms = await khatmService_getPublicList({ limit: 20 })
	} else {
		khatms = appSettingsService_getStaleShowcaseWhileRevalidate()
	}

	return {
		khatms,
	}
}
