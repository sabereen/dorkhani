import type { AccountData } from '$lib/contracts/api'
import { loadApi } from '$lib/utility/request'
import { redirect } from '@sveltejs/kit'
import { base } from '$app/paths'
import { localizeHref } from '$lib/paraglide/runtime.js'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, url }) => {
	try {
		return await loadApi<AccountData>('/account', { fetch, origin: url.origin })
	} catch (cause) {
		if (cause && typeof cause === 'object' && 'status' in cause && cause.status === 401) {
			redirect(303, localizeHref(`${base}/auth/login`))
		}
		throw cause
	}
}
