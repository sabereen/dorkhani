import { error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import { khatmService_getFull } from '$service/khatm'
import { match as matchNormalParam } from '../../params/normalKhatm'
import { match as matchAyahParam } from '../../params/ayahKhatm'

export const load: LayoutServerLoad = async ({ params, url }) => {
	const khatmParam = params.khatm || ''
	const khatmId = parseInt(khatmParam.slice(1) || '-1')
	const accessToken = url.searchParams.get('t') || null

	const khatm = await khatmService_getFull(khatmId, accessToken)

	if (!khatm) {
		throw error(404, { message: 'ختم مورد نظر پیدا نشد.' })
	}

	const isMatchValid =
		khatm.rangeType === 'ayah' ? matchAyahParam(khatmParam) : matchNormalParam(khatmParam)
	if (!isMatchValid) {
		throw error(404, { message: 'ختم مورد نظر پیدا نشد.' })
	}

	return {
		khatm,
		origin: url.origin,
	}
}
