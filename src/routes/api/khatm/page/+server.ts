import type { KhatmPageData } from '$lib/contracts/api'
import {
	khatmService_getBySeriesRecord,
	khatmService_getDeletionReason,
	khatmService_getFullRecord,
	khatmService_toPublic,
} from '$service/khatm'
import { auth_checkIsAdmin, auth_ensureIsAdmin } from '$service/auth'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async (event) => {
	const resource = event.url.searchParams.get('resource') || ''
	const accessToken = event.url.searchParams.get('t') || null
	const requestsAdminAccess = event.url.searchParams.get('admin') === '1'
	if (requestsAdminAccess) auth_ensureIsAdmin(event)
	const isAdmin = requestsAdminAccess || auth_checkIsAdmin(event)
	const match = /^(a|k)(s?)(\d+)$/.exec(resource)
	if (!match) error(404, { message: 'ختم مورد نظر پیدا نشد.' })

	const expectedAyah = match[1] === 'a'
	const isSerial = match[2] === 's'
	const resourceId = Number(match[3])
	const khatm = isSerial
		? await khatmService_getBySeriesRecord(resourceId, accessToken, { bypassAccessToken: isAdmin })
		: await khatmService_getFullRecord(resourceId, accessToken, { bypassAccessToken: isAdmin })

	if (!khatm) {
		const deletionReason = await khatmService_getDeletionReason(resourceId, isSerial)
		if (deletionReason === 'expiredUnstarted') {
			error(410, {
				message: 'این ختم به‌دلیل آغاز نشدن در مهلت تعیین‌شده، به‌صورت خودکار حذف شده است.',
				type: 'khatm-expired',
			})
		}
		if (deletionReason === 'owner') {
			error(410, { message: 'این ختم توسط سازنده حذف شده است.', type: 'khatm-deleted' })
		}
		if (deletionReason === 'admin') {
			error(410, { message: 'این ختم توسط مدیر سامانه حذف شده است.', type: 'khatm-deleted' })
		}
		error(404, { message: 'ختم مورد نظر پیدا نشد.' })
	}
	if (isSerial !== (khatm.seriesId != null) || expectedAyah !== (khatm.rangeType === 'ayah')) {
		error(404, { message: 'ختم مورد نظر پیدا نشد.' })
	}

	const isOwner = Boolean(event.locals.user && khatm.ownerId === event.locals.user.id)
	return json({
		khatm: khatmService_toPublic(khatm),
		isAuthenticated: Boolean(event.locals.user),
		isAdmin,
		isOwner,
		canEdit: isAdmin || isOwner,
		canStopSeries: Boolean(khatm.series && khatm.series.maxRounds == null),
		seriesMaxRounds: khatm.series?.maxRounds ?? null,
		featuredOrder: khatm.series?.featuredOrder ?? null,
		canFeature: Boolean(
			!khatm.private &&
				khatm.status === 'inProgress' &&
				khatm.series &&
				khatm.series.maxRounds == null,
		),
	} satisfies KhatmPageData)
}
