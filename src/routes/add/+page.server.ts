import { fail } from '@sveltejs/kit'
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

		if (!title) {
			return fail(400, { errorMessage: 'عنوان اجباری است.' })
		}

		const khatm = await db.tKhatm.create({
			data: {
				title: String(title),
				description: String(description),
				rangeType: rangeType as RangeType,
				private: isPrivate,
			},
		})

		const hash = isPrivate ? await signPrivateKhatm(khatm) : null

		return { khatm, hash }
	},
} satisfies Actions
