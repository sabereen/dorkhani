import type { ZekrRecord } from '$lib/contracts/domain'
import { loadApi } from '$lib/utility/request'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ fetch, params, url }) =>
	loadApi<{ zekr: ZekrRecord }>(`/zekr/${Number((params.zekr || '').slice(1))}`, {
		fetch,
		origin: url.origin,
	})
