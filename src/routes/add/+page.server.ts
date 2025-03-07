import { error } from '@sveltejs/kit'
import type { Actions } from './$types'
import { db } from '$lib/server/db'

export const actions = {
	default: async (event) => {
		const form = await event.request.formData()
		const title = form.get('title')
		const description = form.get('description')

		if (!title || !description) {
			throw error(400, { message: 'عنوان و توضیحات اجباری است.' })
		}

		const khatm = await db.khatm.create({
			data: {
				title: String(title),
				description: String(description),
			},
		})

		return { khatm }
	},
} satisfies Actions
