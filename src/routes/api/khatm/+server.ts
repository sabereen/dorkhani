import { khatmService_getDeletionReason, khatmService_getFull } from '$service/khatm'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ url }) => {
	const khatmId = +url.searchParams.get('khatmId')!
	const accessToken = url.searchParams.get('accessToken') || null

	const khatm = await khatmService_getFull(khatmId, accessToken)

	if (!khatm) {
		const deletionReason = await khatmService_getDeletionReason(khatmId)
		if (deletionReason === 'expiredUnstarted') {
			throw error(410, {
				message: 'این ختم به‌دلیل آغاز نشدن در مهلت تعیین‌شده، به‌صورت خودکار حذف شده است.',
				type: 'khatm-expired',
			})
		}
		if (deletionReason === 'owner') {
			throw error(410, { message: 'این ختم توسط سازنده حذف شده است.', type: 'khatm-deleted' })
		}
		throw error(404, { message: 'ختم پیدا نشد' })
	}

	return json({
		khatm: khatm,
	})
}
