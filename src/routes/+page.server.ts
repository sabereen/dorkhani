import { khatmService_getPublicList } from '$service/khatm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
	const khatms = await khatmService_getPublicList()

	return {
		khatms,
		origin: url.origin,
	}
}
