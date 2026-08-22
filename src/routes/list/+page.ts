import { khatmDirectory_parseSearchParams, type KhatmDirectoryResult } from '$lib/entity/KhatmDirectory'
import { loadApi } from '$lib/utility/request'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, url }) => {
	const filters = khatmDirectory_parseSearchParams(url.searchParams)
	const result = await loadApi<KhatmDirectoryResult>('/khatm/directory', {
		fetch,
		origin: url.origin,
		body: filters,
	})
	return { ...result, filters }
}
