import { khatmDirectory_parseSearchParams } from '$lib/entity/KhatmDirectory'
import { khatmService_getDirectoryList } from '$service/khatm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
	const { cursor: _cursor, ...filters } = khatmDirectory_parseSearchParams(url.searchParams)
	const result = await khatmService_getDirectoryList(filters)

	return {
		...result,
		filters,
	}
}
