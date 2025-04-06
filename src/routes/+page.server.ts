import { khatmService_getPublicList } from '$service/khatm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	const khatms = await khatmService_getPublicList()

	return {
		khatms,
	}
}
