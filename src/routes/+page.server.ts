import { appSettingsService_getShowcase } from '$service/appSettings'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	const khatms = appSettingsService_getShowcase()

	return {
		khatms,
	}
}
