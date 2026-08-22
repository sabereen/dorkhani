import {
	KhatmHistoricalRoundError,
	KhatmOwnershipError,
	khatmService_stopOwnedSeries,
} from '$service/khatm'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401, { message: 'ابتدا وارد حساب کاربری شوید.' })
	const id = Number(params.id)
	if (!Number.isSafeInteger(id)) error(404, { message: 'ختم پیدا نشد.' })
	try {
		const stopped = await khatmService_stopOwnedSeries(locals.user.id, id)
		if (stopped == null) error(404, { message: 'ختم پیدا نشد.' })
		if (!stopped) error(409, { message: 'این ختم از نوع تمام‌نشدنی نیست.' })
		return json({ stopped: true })
	} catch (cause) {
		if (cause instanceof KhatmOwnershipError) error(403, { message: 'اجازه توقف این ختم را ندارید.' })
		if (cause instanceof KhatmHistoricalRoundError) {
			error(409, { message: 'فقط از دور جاری می‌توان ختم را متوقف کرد.' })
		}
		throw cause
	}
}
