import { db } from '$lib/server/db'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async (event) => {
	const body: { start: number; end: number } = await event.request.json()

	if (typeof body.start !== 'number' || typeof body.end !== 'number') {
		throw error(400, 'ورودی معتبر نیست')
	}

	if (body.start < 0 || body.start > 6236 || body.end < body.start || body.end > 6236) {
		throw error(400, 'ورودی معتبر نیست.')
	}

	const khatmId = +event.params.khatmId

	const result = await db.khatm.update({
		where: {
			id: khatmId,
			parts: {
				every: {
					OR: [{ end: { lte: body.start } }, { start: { gte: body.end } }],
				},
			},
		},
		data: {
			currentAyahIndex: {
				increment: body.end - body.start,
			},
			parts: {
				create: {
					start: body.start,
					end: body.end,
					status: 'inprogress',
				},
			},
		},
	})

	return json(result)
}
