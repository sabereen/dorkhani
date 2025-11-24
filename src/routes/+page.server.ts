import { appSettingsService_getStaleShowcaseWhileRevalidate } from '$service/appSettings'
import { khatmService_getPublicList } from '$service/khatm'
import { zekrService_getPublicList } from '$service/zekr'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	const khatms = await khatmService_getPublicList({ limit: 20 })
	const showcase = appSettingsService_getStaleShowcaseWhileRevalidate()

	const zekrList = await zekrService_getPublicList()

	return {
		khatms,
		showcase,
		zekrList,
	}
}
