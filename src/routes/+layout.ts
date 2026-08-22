import { env } from '$env/dynamic/public'
import type { LayoutLoad } from './$types'
import type { AppBootstrap } from '$lib/contracts/api'
import { loadApi } from '$lib/utility/request'

export const ssr = env.PUBLIC_BUILD_TARGET !== 'capacitor'

export const load: LayoutLoad = async ({ fetch, url, depends }) => {
	depends('app:bootstrap')
	return loadApi<AppBootstrap>('/app/bootstrap', { fetch, origin: url.origin })
}
