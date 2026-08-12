import { auth_ensureIsAdmin } from '$service/auth'
import {
	KhatmFeaturedEligibilityError,
	KhatmFeaturedLimitError,
	KhatmFeaturedOrderError,
	khatmService_getFeaturedAdminList,
	khatmService_reorderFeatured,
	khatmService_setFeatured,
} from '$service/khatm'
import { error, json, type RequestHandler } from '@sveltejs/kit'

function handleFeaturedError(cause: unknown): never {
	if (cause instanceof KhatmFeaturedEligibilityError) {
		throw error(400, {
			message: 'فقط ختم‌های عمومی، تأییدشده و دائمیِ در حال اجرا قابل انتخاب هستند.',
		})
	}
	if (cause instanceof KhatmFeaturedLimitError) {
		throw error(409, { message: 'حداکثر شش ختم شاخص قابل انتخاب است.' })
	}
	if (cause instanceof KhatmFeaturedOrderError) {
		throw error(409, { message: 'فهرست ختم‌های شاخص تغییر کرده است؛ صفحه را تازه کنید.' })
	}
	throw cause
}

export const GET: RequestHandler = async (event) => {
	auth_ensureIsAdmin(event)
	return json({ items: await khatmService_getFeaturedAdminList() })
}

export const POST: RequestHandler = async (event) => {
	auth_ensureIsAdmin(event)
	const body: { khatmId?: unknown; featured?: unknown } = await event.request
		.json()
		.catch(() => ({}))
	if (
		typeof body.khatmId !== 'number' ||
		!Number.isSafeInteger(body.khatmId) ||
		typeof body.featured !== 'boolean'
	) {
		throw error(400, { message: 'درخواست انتخاب ختم شاخص معتبر نیست.' })
	}

	try {
		return json({ items: await khatmService_setFeatured(body.khatmId, body.featured) })
	} catch (cause) {
		handleFeaturedError(cause)
	}
}

export const PUT: RequestHandler = async (event) => {
	auth_ensureIsAdmin(event)
	const body: { seriesIds?: unknown } = await event.request.json().catch(() => ({}))
	if (!Array.isArray(body.seriesIds)) {
		throw error(400, { message: 'ترتیب ختم‌های شاخص معتبر نیست.' })
	}

	try {
		return json({ items: await khatmService_reorderFeatured(body.seriesIds) })
	} catch (cause) {
		handleFeaturedError(cause)
	}
}
