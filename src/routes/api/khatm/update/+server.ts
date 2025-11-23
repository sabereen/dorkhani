import { auth_ensureIsAdmin } from '$service/auth'
import { khatmService_update } from '$service/khatm'
import type { ReviewStatus } from '@prisma/client'
import { json, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async (event) => {
	auth_ensureIsAdmin(event)
	const body: { id: number; reviewStatus: ReviewStatus } = await event.request.json()
	const khatm = await khatmService_update(body.id, { reviewStatus: body.reviewStatus })
	return json({ khatm })
}
