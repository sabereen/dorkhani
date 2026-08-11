import {
	KhatmOwnershipError,
	type KhatmManagementActor,
	khatmService_delete,
} from '$service/khatm'
import { auth_checkIsAdmin, auth_ensureIsAdmin } from '$service/auth'
import { base } from '$app/paths'
import { error, redirect, type RequestEvent, type RequestHandler } from '@sveltejs/kit'

type ManagementEvent = Pick<RequestEvent, 'locals' | 'request' | 'setHeaders' | 'url'>

function getManagementActor(event: ManagementEvent): KhatmManagementActor | null {
	if (event.url.searchParams.get('admin') === '1') {
		auth_ensureIsAdmin(event)
		return { kind: 'admin' }
	}
	if (auth_checkIsAdmin(event)) return { kind: 'admin' }
	if (event.locals.user) return { kind: 'owner', ownerId: event.locals.user.id }
	return null
}

export const POST: RequestHandler = async (event) => {
	const { params } = event
	const actor = getManagementActor(event)
	if (!actor) throw error(401, { message: 'ابتدا وارد حساب کاربری شوید.' })
	const id = Number(params.id)
	if (!Number.isSafeInteger(id)) throw error(404, { message: 'ختم پیدا نشد.' })
	try {
		const deleted = await khatmService_delete(actor, id)
		if (!deleted) throw error(404, { message: 'ختم پیدا نشد.' })
	} catch (cause) {
		if (cause instanceof KhatmOwnershipError) {
			throw error(403, { message: 'اجازه حذف این ختم را ندارید.' })
		}
		throw cause
	}
	redirect(303, actor.kind === 'admin' ? `${base}/admin/review` : `${base}/account`)
}
