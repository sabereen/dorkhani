import { khatmService_getList } from '$service/khatm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	return {
		list: await khatmService_getList('approved'),
	}
}
