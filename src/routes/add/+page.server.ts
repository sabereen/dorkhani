import { error } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { db } from '$lib/server/db'
import type { RangeType } from '@prisma/client'
import { signPrivateKhatm } from '$lib/server/security'

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
		const isPrivate = form.get('private') === 'on'
		let sequential = form.get('sequentialType') === 'sequential'

		if (!title) {
			throw error(400, { message: 'عنوان اجباری است.' })
		}

		// در حالت آیه به آیه امکان انتخاب آیه دلخواه نیست
		if (rangeType === 'ayah') sequential = true
		// در حالت آزاد امکان انتساب خودکار بازه به کاربر نیست
		if (rangeType === 'free') sequential = false

		const khatm = await db.khatm.create({
			data: {
				title: String(title),
				description: String(description),
				rangeType: rangeType as RangeType,
				private: isPrivate,
				sequential,
			},
		})

		const hash = isPrivate ? await signPrivateKhatm(khatm) : null

		return { khatm, hash }
	},
} satisfies Actions
