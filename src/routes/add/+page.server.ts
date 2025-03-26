import { error } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { db } from '$lib/server/db'

export const load: PageServerLoad = ({ url }) => {
	return {
		rangeType: url.searchParams.get('rangeType'),
	}
}

export const actions = {
	default: async (event) => {
		const form = await event.request.formData()
		const title = form.get('title')
		let rangeType = form.get('rangeType') as 'ayah' | 'free'
		rangeType = rangeType === 'ayah' ? 'ayah' : 'free'
		const description = form.get('description')

		if (!title || !description) {
			throw error(400, { message: 'عنوان و توضیحات اجباری است.' })
		}

		const khatm = await db.khatm.create({
			data: {
				title: String(title),
				description: String(description),
				rangeType,
				sequential: rangeType === 'ayah',
			},
		})

		return { khatm }
	},
} satisfies Actions
