import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'
import { zekrService_create } from '$service/zekr'

export const actions = {
	default: async (event) => {
		const form = await event.request.formData()
		const title = form.get('title')
		const zekrText = form.get('zekrText')
		const targetCount = +form.get('targetCount')!
		const description = form.get('description') || ''

		if (!title) {
			return fail(400, { errorMessage: 'عنوان اجباری است.' })
		}

		const zekr = await zekrService_create({
			title: String(title).trim(),
			description: String(description).trim(),
			targetCount: targetCount || undefined,
			zekrText: String(zekrText).trim(),
		})

		return { zekr }
	},
} satisfies Actions
