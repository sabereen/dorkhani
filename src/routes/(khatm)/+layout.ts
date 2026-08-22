import type { LayoutLoad } from './$types'
import type { KhatmPageData } from '$lib/contracts/api'
import { loadApi } from '$lib/utility/request'
import { disableKhatmShortcut } from '$lib/native/khatm-shortcuts'

export const load: LayoutLoad = async ({ fetch, params, url }) => {
	try {
		return await loadApi<KhatmPageData>('/khatm/page', {
			fetch,
			origin: url.origin,
			body: {
				resource: params.khatm,
				t: url.searchParams.get('t'),
				admin: url.searchParams.get('admin'),
			},
		})
	} catch (cause) {
		const status =
			typeof cause === 'object' && cause && 'status' in cause ? Number(cause.status) : undefined
		if (status === 404 || status === 410) {
			await disableKhatmShortcut(params.khatm).catch(() => undefined)
		}
		throw cause
	}
}
