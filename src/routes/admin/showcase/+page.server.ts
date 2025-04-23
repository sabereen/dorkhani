import { appSettingsService_getShowcase } from '$service/appSettings'
import { khatmService_getPublicList } from '$service/khatm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	const showcaseKhatms = appSettingsService_getShowcase()
	const lastKhatms = await khatmService_getPublicList()

	return {
		lastKhatms,
		showcaseKhatms,
	}
}
