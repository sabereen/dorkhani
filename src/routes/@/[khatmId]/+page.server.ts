import { db } from '$lib/server/db'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, url }) => {
	const khatmId = parseInt(params.khatmId, 36)
	const accessToken = url.searchParams.get('token') || null

	const khatm = await db.tKhatm.findUnique({
		include: { parts: true },
		where: { id: khatmId, accessToken: { equals: accessToken } },
	})

	if (!khatm) {
		throw error(400, { message: 'ختم مورد نظر پیدا نشد.' })
	}

	return {
		khatm,
	}
}
