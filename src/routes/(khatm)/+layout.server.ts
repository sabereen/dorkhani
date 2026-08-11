import { error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import {
	khatmService_getBySeriesRecord,
	khatmService_getFullRecord,
	khatmService_isDeleted,
	khatmService_toPublic,
} from '$service/khatm'
import { match as matchNormalParam } from '../../params/normalKhatm'
import { match as matchAyahParam } from '../../params/ayahKhatm'

export const load: LayoutServerLoad = async ({ params, url, locals }) => {
	const khatmParam = params.khatm || ''
	const accessToken = url.searchParams.get('t') || null

	const isSerialUrl = khatmParam[1] === 's'

	const resourceId = parseInt(khatmParam.slice(isSerialUrl ? 2 : 1) || '-1')
	const khatm = isSerialUrl
		? await khatmService_getBySeriesRecord(resourceId, accessToken)
		: await khatmService_getFullRecord(resourceId, accessToken)

	if (!khatm) {
		if (await khatmService_isDeleted(resourceId, isSerialUrl)) {
			throw error(410, { message: 'این ختم توسط سازنده حذف شده است.', type: 'khatm-deleted' })
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

	return {
		khatm: khatmService_toPublic(khatm),
		isAuthenticated: Boolean(locals.user),
		canManage: Boolean(locals.user && khatm.ownerId === locals.user.id),
	}
}
