import { khatmService_getList } from '$service/khatm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	const list = await khatmService_getList('pending')

	return {
		list,
	}
}
