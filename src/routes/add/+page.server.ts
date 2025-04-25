import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import type { RangeType } from '@prisma/client'
import { khatmService_create } from '$service/khatm'

export const load: PageServerLoad = ({ url }) => {
	return {
		rangeType: url.searchParams.get('rangeType'),
	}
}

export const actions = {
	default: async (event) => {
		const form = await event.request.formData()
		const title = form.get('title')
		const rangeType = String(form.get('rangeType'))
		const description = form.get('description') || ''
		const isPrivate = form.get('access') === 'private'

		if (!title) {
			return fail(400, { errorMessage: 'عنوان اجباری است.' })
		}

		const khatm = await khatmService_create({
			title: String(title).trim(),
			description: String(description).trim(),
			rangeType: rangeType as RangeType,
			private: isPrivate,
		})

		return { khatm }
	},
} satisfies Actions
