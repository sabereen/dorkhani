import { KhatmOwnershipError, khatmService_deleteOwned } from '$service/khatm'
import { base } from '$app/paths'
import { error, redirect, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) throw error(401, { message: 'ابتدا وارد حساب کاربری شوید.' })
	const id = Number(params.id)
	if (!Number.isSafeInteger(id)) throw error(404, { message: 'ختم پیدا نشد.' })
	try {
		const deleted = await khatmService_deleteOwned(locals.user.id, id)
		if (!deleted) throw error(404, { message: 'ختم پیدا نشد.' })
	} catch (cause) {
		if (cause instanceof KhatmOwnershipError) throw error(403, { message: 'اجازه حذف این ختم را ندارید.' })
		throw cause
	}
	redirect(303, `${base}/account`)
}
