import { auth_ensureIsAdmin } from '$service/auth'
import { khatmService_getList } from '$service/khatm'
import type { ReviewStatus } from '@prisma-client'
import { json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async (event) => {
	const { url } = event
	const khatmId = url.searchParams.get('pageID')
	let reviewStatus = url.searchParams.get('reviewStatus') as ReviewStatus

	if (reviewStatus === 'pending' || reviewStatus === 'rejected') {
		auth_ensureIsAdmin(event)
	} else {
		reviewStatus = 'approved'
	}

	const list = await khatmService_getList(reviewStatus, khatmId == null ? undefined : +khatmId)

	return json({
		list,
	})
}
