import type { RangeType } from '@prisma-client'
import { base } from '$app/paths'
import {
	KhatmHistoricalRoundError,
	KhatmOwnershipError,
	KhatmRangeLockedError,
	type KhatmManagementActor,
	khatmService_edit,
	khatmService_getForEdit,
} from '$service/khatm'
import { auth_checkIsAdmin, auth_ensureIsAdmin } from '$service/auth'
import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const rangeTypes = new Set<RangeType>(['free', 'page', 'hizbQuarter', 'surah', 'juz', 'ayah'])

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

function getAdminDetailPath(khatm: { id: number; rangeType: RangeType; seriesId: number | null }) {
	let prefix = khatm.rangeType === 'ayah' ? 'a' : 'k'
	if (khatm.seriesId != null) prefix += 's'
	return `${base}/${prefix}${khatm.seriesId ?? khatm.id}?admin=1`
}

export const load: PageServerLoad = async (event) => {
	const { params } = event
	const actor = getManagementActor(event)
	if (!actor) redirect(303, `${base}/auth/login`)
	const id = Number(params.id)
	if (!Number.isSafeInteger(id)) throw error(404, { message: 'ختم پیدا نشد.' })

	try {
		const result = await khatmService_getForEdit(actor, id)
		if (!result) throw error(404, { message: 'ختم پیدا نشد.' })
		return { ...result, isAdmin: actor.kind === 'admin' }
	} catch (cause) {
		if (cause instanceof KhatmOwnershipError) {
			throw error(403, { message: 'اجازه ویرایش این ختم را ندارید.' })
		}
		if (cause instanceof KhatmHistoricalRoundError) {
			throw error(409, {
				message: 'دورهای پایان‌یافته برای حفظ سابقه قابل ویرایش نیستند.',
			})
		}
		throw cause
	}
}

export const actions = {
	default: async (event) => {
		const { request, params } = event
		const actor = getManagementActor(event)
		if (!actor) throw error(401, { message: 'ابتدا وارد حساب کاربری شوید.' })
		const id = Number(params.id)
		if (!Number.isSafeInteger(id)) throw error(404, { message: 'ختم پیدا نشد.' })
		const form = await request.formData()
		const title = String(form.get('title') || '').trim()
		const description = String(form.get('description') || '').trim()
		const rangeType = String(form.get('rangeType')) as RangeType
		if (!title || title.length > 100) return fail(400, { errorMessage: 'عنوان معتبر نیست.' })
		if (!rangeTypes.has(rangeType)) return fail(400, { errorMessage: 'نوع بازه معتبر نیست.' })

		let destination = `${base}/account`
		try {
			const result = await khatmService_edit(actor, id, {
				title,
				description,
				rangeType,
				private: form.get('access') === 'private',
				disableSeries: form.get('disableSeries') === 'on',
			})
			if (!result) throw error(404, { message: 'ختم پیدا نشد.' })
			if (actor.kind === 'admin') destination = getAdminDetailPath(result)
		} catch (cause) {
			if (cause instanceof KhatmOwnershipError) {
				throw error(403, { message: 'اجازه ویرایش این ختم را ندارید.' })
			}
			if (cause instanceof KhatmHistoricalRoundError) {
				throw error(409, {
					message: 'دورهای پایان‌یافته برای حفظ سابقه قابل ویرایش نیستند.',
				})
			}
			if (cause instanceof KhatmRangeLockedError) {
				return fail(409, { errorMessage: 'پس از ثبت مشارکت، نوع بازه قابل تغییر نیست.' })
			}
			throw cause
		}

		redirect(303, destination)
	},
} satisfies Actions
