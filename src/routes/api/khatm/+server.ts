import { khatmService_getFull, khatmService_isDeleted } from '$service/khatm'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ url }) => {
	const khatmId = +url.searchParams.get('khatmId')!
	const accessToken = url.searchParams.get('accessToken') || null

	const khatm = await khatmService_getFull(khatmId, accessToken)

	if (!khatm) {
		if (await khatmService_isDeleted(khatmId)) {
			throw error(410, { message: 'این ختم توسط سازنده حذف شده است.', type: 'khatm-deleted' })
		}
		throw error(404, { message: 'ختم پیدا نشد' })
	}

	return json({
		khatm: khatm,
	})
}
