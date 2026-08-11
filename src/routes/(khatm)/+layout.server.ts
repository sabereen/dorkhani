import { error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import {
	khatmService_getBySeriesRecord,
	khatmService_getDeletionReason,
	khatmService_getFullRecord,
	khatmService_toPublic,
} from '$service/khatm'
import { match as matchNormalParam } from '../../params/normalKhatm'
import { match as matchAyahParam } from '../../params/ayahKhatm'
import { auth_checkIsAdmin, auth_ensureIsAdmin } from '$service/auth'

export const load: LayoutServerLoad = async (event) => {
	const { params, url, locals } = event
	const khatmParam = params.khatm || ''
	const accessToken = url.searchParams.get('t') || null
	const requestsAdminAccess = url.searchParams.get('admin') === '1'
	if (requestsAdminAccess) auth_ensureIsAdmin(event)
	const isAdmin = requestsAdminAccess || auth_checkIsAdmin(event)

	const isSerialUrl = khatmParam[1] === 's'

	const resourceId = parseInt(khatmParam.slice(isSerialUrl ? 2 : 1) || '-1')
	const khatm = isSerialUrl
		? await khatmService_getBySeriesRecord(resourceId, accessToken, {
				bypassAccessToken: isAdmin,
			})
		: await khatmService_getFullRecord(resourceId, accessToken, {
				bypassAccessToken: isAdmin,
			})

	if (!khatm) {
		const deletionReason = await khatmService_getDeletionReason(resourceId, isSerialUrl)
		if (deletionReason === 'expiredUnstarted') {
			throw error(410, {
				message: 'این ختم به‌دلیل آغاز نشدن در مهلت تعیین‌شده، به‌صورت خودکار حذف شده است.',
				type: 'khatm-expired',
			})
		}
		if (deletionReason === 'owner') {
			throw error(410, { message: 'این ختم توسط سازنده حذف شده است.', type: 'khatm-deleted' })
		}
		if (deletionReason === 'admin') {
			throw error(410, { message: 'این ختم توسط مدیر سامانه حذف شده است.', type: 'khatm-deleted' })
		}
		throw error(404, { message: 'ختم مورد نظر پیدا نشد.' })
	}

	if (isSerialUrl && khatm.seriesId == null) {
		throw error(404, { message: 'ختم مورد نظر پیدا نشد.' })
	}

	// این شرط بعدا می‌تواند ریدایرکت شود به صفحه‌ی درست
	// این برای زمانی کاربرد دارد که بخواهیم یک ختم موجود را ویرایش کنیم و سریال کنیم
	if (!isSerialUrl && khatm.seriesId != null) {
		throw error(404, { message: 'ختم مورد نظر پیدا نشد.' })
	}

	const isMatchValid =
		khatm.rangeType === 'ayah' ? matchAyahParam(khatmParam) : matchNormalParam(khatmParam)
	if (!isMatchValid) {
		throw error(404, { message: 'ختم مورد نظر پیدا نشد.' })
	}

	const isOwner = Boolean(locals.user && khatm.ownerId === locals.user.id)

	return {
		khatm: khatmService_toPublic(khatm),
		isAuthenticated: Boolean(locals.user),
		isAdmin,
		isOwner,
		canEdit: isAdmin || isOwner,
		canStopSeries: Boolean(khatm.series && khatm.series.maxRounds == null),
		seriesMaxRounds: khatm.series?.maxRounds ?? null,
	}
}
