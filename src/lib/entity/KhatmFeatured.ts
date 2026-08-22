import type { KhatmData } from '$lib/contracts/domain'
import { request } from '$lib/utility/request'

export type FeaturedKhatmItem = {
	khatm: KhatmData
	featuredOrder: number
}

export type AdminKhatmListItem = {
	khatm: KhatmData
	featuredOrder: number | null
	canFeature: boolean
}

type FeaturedKhatmResponse = { items: FeaturedKhatmItem[] }

export function featuredKhatm_getList() {
	return request<FeaturedKhatmResponse>('get', '/khatm/featured')
}

export function featuredKhatm_set(khatmId: number, featured: boolean) {
	return request<FeaturedKhatmResponse>('post', '/khatm/featured', { khatmId, featured })
}

export function featuredKhatm_reorder(seriesIds: number[]) {
	return request<FeaturedKhatmResponse>('put', '/khatm/featured', { seriesIds })
}
