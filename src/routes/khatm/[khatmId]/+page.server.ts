import { db } from '$lib/server/db'
import { error } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const khatmId = +params.khatmId

	const khatm = await db.khatm.findUnique({
		include: { parts: true },
		where: { id: khatmId },
	})

	if (!khatm) {
		throw error(400, { message: 'ختم مورد نظر پیدا نشد.' })
	}

	return {
		khatm,
	}
}

export const actions = {
	async default({ request }) {
		const form = await request.formData()
		const start = Number(form.get('start'))
		const end = Number(form.get('end'))
		const khatmId = Number(form.get('khatmId'))

		if (isNaN(start) || isNaN(end)) return error(400, { message: 'بازه نامعتبر است' })

		const part = await db.khatmPart.create({
			data: {
				khatmId,
				start,
				end,
				status: 'inprogress',
			},
		})

		return part
	},
} satisfies Actions
