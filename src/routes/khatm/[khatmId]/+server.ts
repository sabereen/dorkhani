import { db } from '$lib/server/db'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { verifyPrivateKhatm } from '$lib/server/security'

export const POST: RequestHandler = async (event) => {
	const body: { start: number; end: number; token?: string } = await event.request.json()

	if (typeof body.start !== 'number' || typeof body.end !== 'number') {
		throw error(400, 'ورودی معتبر نیست')
	}

	if (body.start < 0 || body.start > 6236 || body.end < body.start || body.end > 6236) {
		throw error(400, 'ورودی معتبر نیست.')
	}

	const khatmId = +event.params.khatmId

	/** آیا اگر ختم خصوصی بود باز هم آپدیت شود؟ */
	let privateAllowed = false

	// اگر توکن داشت تلاش می‌کنیم اعتبارسنجی کنیم
	// وگرنه نیازی به این کار نیست و شرط privateAllowed در کوئری جلوی درخواست بدون توکن به ختم خصوصی را می‌گیرد.
	if (body.token) {
		const khatm = await db.khatm.findUnique({ where: { id: khatmId } })
		if (!khatm) throw error(404, { message: 'ختم وجود ندارد.' })
		if (khatm?.private) {
			privateAllowed = await verifyPrivateKhatm(khatm, body.token)
			if (!privateAllowed) throw error(403, 'شما اجازه دسترسی به این ختم را ندارید.')
		}
	}

	const result = await db.khatm.update({
		where: {
			id: khatmId,
			private: privateAllowed,
			parts: {
				every: {
					OR: [{ end: { lte: body.start } }, { start: { gte: body.end } }],
				},
			},
		},
		data: {
			currentAyahIndex: {
				increment: body.end - body.start,
			},
			parts: {
				create: {
					start: body.start,
					end: body.end,
					status: 'inprogress',
				},
			},
		},
	})

	return json(result)
}
