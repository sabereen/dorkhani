import { auth_ensureIsAdmin } from '$service/auth'
import { khatmService_getAdminList, khatmService_getList } from '$service/khatm'
import type { ReviewStatus } from '@prisma-client'
import { json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async (event) => {
	const { url } = event
	const khatmId = url.searchParams.get('pageID')
	const admin = url.searchParams.get('admin') === '1'
	let reviewStatus = url.searchParams.get('reviewStatus') as ReviewStatus

	if (admin || reviewStatus === 'pending' || reviewStatus === 'rejected') {
		auth_ensureIsAdmin(event)
	} else {
		reviewStatus = 'approved'
	}

	const pageID = khatmId == null ? undefined : +khatmId
	const list = admin
		? await khatmService_getAdminList(reviewStatus, pageID)
		: await khatmService_getList(reviewStatus, pageID)

	return json({
		list,
	})
}
