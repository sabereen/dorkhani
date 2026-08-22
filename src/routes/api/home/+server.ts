import type { HomeData } from '$lib/contracts/api'
import {
	khatmService_getAutomaticShowcase,
	khatmService_getFeaturedShowcase,
	khatmService_getPublicList,
} from '$service/khatm'
import { statisticsService_getLandingStatistics } from '$service/statistics'
import { zekrService_getPublicList } from '$service/zekr'
import { json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async () => {
	const [khatms, featuredKhatms, showcase, zekrList, statistics] = await Promise.all([
		khatmService_getPublicList({ limit: 20 }),
		khatmService_getFeaturedShowcase(),
		khatmService_getAutomaticShowcase(),
		zekrService_getPublicList(),
		statisticsService_getLandingStatistics(),
	])

	return json({ khatms, featuredKhatms, showcase, zekrList, statistics } satisfies HomeData)
}
