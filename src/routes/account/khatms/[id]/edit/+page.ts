import type { KhatmEditData } from '$lib/contracts/api'
import { loadApi } from '$lib/utility/request'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ fetch, params, url }) =>
	loadApi<KhatmEditData>(
		`/account/khatms/${params.id}${url.searchParams.get('admin') === '1' ? '?admin=1' : ''}`,
		{ fetch, origin: url.origin },
	)
