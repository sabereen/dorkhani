import {
	appSettings_store,
	appSettingsService_getStaleShowcaseWhileRevalidate,
} from '$service/appSettings'
import { khatmService_getPublicList } from '$service/khatm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	const showcaseKhatms = appSettingsService_getStaleShowcaseWhileRevalidate()
	const lastKhatms = await khatmService_getPublicList({ limit: 50 })

	return {
		lastKhatms,
		showcaseKhatms,
		autoShowcase: appSettings_store.config.autoShowcase,
	}
}
