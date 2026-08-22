import { khatmService_getDeletionReason, khatmService_getFull } from '$service/khatm'
import { error, json, type RequestHandler } from '@sveltejs/kit'
import * as m from '$lib/paraglide/messages.js'

export const GET: RequestHandler = async ({ url }) => {
	const khatmId = +url.searchParams.get('khatmId')!
	const accessToken = url.searchParams.get('accessToken') || null

	const khatm = await khatmService_getFull(khatmId, accessToken)

	if (!khatm) {
		const deletionReason = await khatmService_getDeletionReason(khatmId)
		if (deletionReason === 'expiredUnstarted') {
			throw error(410, {
				message: m.error_khatm_expired(),
				code: 'khatm_expired',
				type: 'khatm-expired',
			})
		}
		if (deletionReason === 'owner') {
			throw error(410, { message: m.error_khatm_deleted(), code: 'khatm_deleted', type: 'khatm-deleted' })
		}
		throw error(404, { message: m.error_khatm_not_found(), code: 'khatm_not_found' })
	}

	return json({
		khatm: khatm,
	})
}
