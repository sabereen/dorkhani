import { db } from '$lib/server/db'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async (event) => {
	const body: [start: number, end: number][] = await event.request.json()

	if (
		!(body instanceof Array) ||
		!body.every((item) => typeof item[0] === 'number' && typeof item[1] === 'number')
	) {
		throw error(400, 'ورودی معتبر نیست')
	}

	const result = await db.khatmPart.createMany({
		data: body.map(([start, end]) => ({
			start,
			end,
			khatmId: +event.params.khatmId,
			status: 'inprogress',
		})),
	})

	return json(result)
}
