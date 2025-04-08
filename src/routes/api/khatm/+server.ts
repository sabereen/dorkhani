import { khatmService_getFull } from '$service/khatm'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ url }) => {
	const khatmId = +url.searchParams.get('khatmId')!
	const accessToken = url.searchParams.get('accessToken') || null

	const khatm = await khatmService_getFull(khatmId, accessToken)

	if (!khatm) throw error(404, { message: 'ختم پیدا نشد' })

	return json({
		khatm: khatm,
	})
}
