import { auth_ensureIsAdmin } from '$service/auth'
import { khatmService_update } from '$service/khatm'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async (event) => {
	auth_ensureIsAdmin(event)
	const body: { id?: unknown; reviewStatus?: unknown } = await event.request
		.json()
		.catch(() => ({}))
	if (
		typeof body.id !== 'number' ||
		!Number.isSafeInteger(body.id) ||
		(body.reviewStatus !== 'approved' && body.reviewStatus !== 'rejected')
	) {
		throw error(400, { message: 'درخواست تغییر وضعیت ختم معتبر نیست.' })
	}
	const khatm = await khatmService_update(body.id, { reviewStatus: body.reviewStatus })
	if (!khatm) throw error(404, { message: 'ختم مورد نظر پیدا نشد.' })
	return json({ khatm })
}
