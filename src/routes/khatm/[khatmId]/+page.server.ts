import { db } from '$lib/server/db'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

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
