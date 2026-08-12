import {
	khatmService_getAutomaticShowcase,
	khatmService_getFeaturedShowcase,
	khatmService_getPublicList,
} from '$service/khatm'
import { statisticsService_getLandingStatistics } from '$service/statistics'
import { zekrService_getPublicList } from '$service/zekr'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	const [khatms, featuredKhatms, showcase, zekrList, statistics] = await Promise.all([
		khatmService_getPublicList({ limit: 20 }),
		khatmService_getFeaturedShowcase(),
		khatmService_getAutomaticShowcase(),
		zekrService_getPublicList(),
		statisticsService_getLandingStatistics(),
	])

	return {
		khatms,
		featuredKhatms,
		showcase,
		zekrList,
		statistics,
	}
}
