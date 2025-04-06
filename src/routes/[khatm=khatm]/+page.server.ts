import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { khatmService_getFull } from '$service/khatm'

export const load: PageServerLoad = async ({ params, url }) => {
	const khatmId = parseInt(params.khatm.slice(1))
	const accessToken = url.searchParams.get('t') || null

	const khatm = await khatmService_getFull(khatmId, accessToken)

	if (!khatm) {
		throw error(400, { message: 'ختم مورد نظر پیدا نشد.' })
	}

	return {
		khatm,
	}
}
