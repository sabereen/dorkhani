import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { zekrService_get } from '$service/zekr'

export const load: PageServerLoad = async ({ params }) => {
	const zekrParam = params.zekr || ''
	const zekrId = parseInt(zekrParam.slice(1) || '-1')

	const zekr = await zekrService_get(zekrId)

	if (!zekr) {
		throw error(404, { message: 'ختم مورد نظر پیدا نشد.' })
	}

	return {
		zekr,
	}
}
