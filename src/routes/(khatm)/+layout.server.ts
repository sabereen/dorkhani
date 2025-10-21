import { error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import { khatmService_getBySeries, khatmService_getFull } from '$service/khatm'
import { match as matchNormalParam } from '../../params/normalKhatm'
import { match as matchAyahParam } from '../../params/ayahKhatm'
import type { TKhatm } from '@prisma/client'

export const load: LayoutServerLoad = async ({ params, url }) => {
	const khatmParam = params.khatm || ''
	const accessToken = url.searchParams.get('t') || null

	const isSerialUrl = khatmParam[1] === 's'

	let khatm: TKhatm | null = null
	if (isSerialUrl) {
		const seriesId = parseInt(khatmParam.slice(2) || '-1')
		khatm = await khatmService_getBySeries(seriesId, accessToken)
	} else {
		const khatmId = parseInt(khatmParam.slice(1) || '-1')
		khatm = await khatmService_getFull(khatmId, accessToken)
	}

	if (!khatm) {
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
		khatm,
	}
}
