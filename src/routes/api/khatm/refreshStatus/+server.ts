import { auth_ensureIsAdmin } from '$service/auth'
import { khatmService_checkAndUpdateStatus } from '$service/khatm'
import { json, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async (event) => {
	auth_ensureIsAdmin(event)
	const { count } = await khatmService_checkAndUpdateStatus()
	return json({ count })
}
