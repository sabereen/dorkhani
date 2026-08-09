import type { RangeType } from '@prisma-client'
import {
	KhatmOwnershipError,
	KhatmRangeLockedError,
	khatmService_editOwned,
	khatmService_getOwnedForEdit,
} from '$service/khatm'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const rangeTypes = new Set<RangeType>(['free', 'page', 'hizbQuarter', 'surah', 'juz', 'ayah'])

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) redirect(303, '/auth/login')
	const id = Number(params.id)
	if (!Number.isSafeInteger(id)) throw error(404, { message: 'ختم پیدا نشد.' })

	try {
		const result = await khatmService_getOwnedForEdit(locals.user.id, id)
		if (!result) throw error(404, { message: 'ختم پیدا نشد.' })
		return result
	} catch (cause) {
		if (cause instanceof KhatmOwnershipError) throw error(403, { message: 'اجازه ویرایش این ختم را ندارید.' })
		throw cause
	}
}

export const actions = {
	default: async ({ request, locals, params }) => {
		if (!locals.user) throw error(401, { message: 'ابتدا وارد حساب کاربری شوید.' })
		const id = Number(params.id)
		if (!Number.isSafeInteger(id)) throw error(404, { message: 'ختم پیدا نشد.' })
		const form = await request.formData()
		const title = String(form.get('title') || '').trim()
		const description = String(form.get('description') || '').trim()
		const rangeType = String(form.get('rangeType')) as RangeType
		if (!title || title.length > 100) return fail(400, { errorMessage: 'عنوان معتبر نیست.' })
		if (!rangeTypes.has(rangeType)) return fail(400, { errorMessage: 'نوع بازه معتبر نیست.' })

		try {
			const result = await khatmService_editOwned(locals.user.id, id, {
				title,
				description,
				rangeType,
				private: form.get('access') === 'private',
				disableSeries: form.get('disableSeries') === 'on',
			})
			if (!result) throw error(404, { message: 'ختم پیدا نشد.' })
		} catch (cause) {
			if (cause instanceof KhatmOwnershipError) throw error(403, { message: 'اجازه ویرایش این ختم را ندارید.' })
			if (cause instanceof KhatmRangeLockedError) {
				return fail(409, { errorMessage: 'پس از ثبت مشارکت، نوع بازه قابل تغییر نیست.' })
			}
			throw cause
		}

		redirect(303, '/account')
	},
} satisfies Actions
