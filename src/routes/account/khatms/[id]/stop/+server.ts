import { base } from '$app/paths'
import { localizeHref } from '$lib/paraglide/runtime.js'
import {
	KhatmHistoricalRoundError,
	KhatmOwnershipError,
	khatmService_stopOwnedSeries,
} from '$service/khatm'
import { error, redirect, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ locals, params, url }) => {
	if (!locals.user) redirect(303, localizeHref(`${base}/auth/login`))

	const id = Number(params.id)
	if (!Number.isSafeInteger(id)) throw error(404, { message: 'ختم پیدا نشد.' })

	try {
		const stopped = await khatmService_stopOwnedSeries(locals.user.id, id)
		if (stopped == null) throw error(404, { message: 'ختم پیدا نشد.' })
		if (!stopped) throw error(409, { message: 'این ختم از نوع تمام‌نشدنی نیست.' })
	} catch (cause) {
		if (cause instanceof KhatmOwnershipError) {
			throw error(403, { message: 'اجازه توقف این ختم را ندارید.' })
		}
		if (cause instanceof KhatmHistoricalRoundError) {
			throw error(409, { message: 'فقط از دور جاری می‌توان ختم را متوقف کرد.' })
		}
		throw cause
	}

	let destination = `${base}/account`
	const returnTo = url.searchParams.get('returnTo')
	if (returnTo) {
		try {
			const requestedUrl = new URL(returnTo, url.origin)
			if (requestedUrl.origin === url.origin && requestedUrl.pathname.startsWith(`${base}/`)) {
				destination = requestedUrl.pathname + requestedUrl.search
			}
		} catch {
			// مسیر بازگشت نامعتبر نادیده گرفته می‌شود.
		}
	}
	redirect(303, destination)
}
