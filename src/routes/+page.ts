import type { PageLoad } from './$types'
import type { HomeData } from '$lib/contracts/api'
import { loadApi } from '$lib/utility/request'

export const load: PageLoad = ({ fetch, url }) =>
	loadApi<HomeData>('/home', { fetch, origin: url.origin })
