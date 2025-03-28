import { error } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { db } from '$lib/server/db'
import type { RangeType } from '@prisma/client'

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
		const description = form.get('description')

		if (!title || !description) {
			throw error(400, { message: 'عنوان و توضیحات اجباری است.' })
		}

		const khatm = await db.khatm.create({
			data: {
				title: String(title),
				description: String(description),
				rangeType: rangeType as RangeType,
				sequential: rangeType === 'ayah',
			},
		})

		return { khatm }
	},
} satisfies Actions
