import { khatmDirectory_parseSearchParams } from '$lib/entity/KhatmDirectory'
import { khatmService_getDirectoryList } from '$service/khatm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
	const { view, q, rangeType } = khatmDirectory_parseSearchParams(url.searchParams)
	const filters = { view, q, rangeType }
	const result = await khatmService_getDirectoryList(filters)

	return {
		...result,
		filters,
	}
}
