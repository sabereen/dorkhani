import type { LayoutLoad } from './$types'
import type { KhatmPageData } from '$lib/contracts/api'
import { loadApi } from '$lib/utility/request'

export const load: LayoutLoad = ({ fetch, params, url }) =>
	loadApi<KhatmPageData>('/khatm/page', {
		fetch,
		origin: url.origin,
		body: {
			resource: params.khatm,
			t: url.searchParams.get('t'),
			admin: url.searchParams.get('admin'),
		},
	})
