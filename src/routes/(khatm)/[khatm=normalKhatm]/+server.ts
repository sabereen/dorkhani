import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { khatmPartService_pickRange } from '$service/khatmPart'

export const POST: RequestHandler = async (event) => {
	const body: { start: number; end: number; accessToken?: string } = await event.request.json()

	if (typeof body.start !== 'number' || typeof body.end !== 'number') {
		throw error(400, 'ورودی معتبر نیست')
	}

	if (body.start < 0 || body.start > 6236 || body.end < body.start || body.end > 6236) {
		throw error(400, 'ورودی معتبر نیست.')
	}

	const khatmId = parseInt(event.params.khatm.slice(1))

	const result = await khatmPartService_pickRange({
		khatmId,
		accessToken: body.accessToken || null,
		start: body.start,
		end: body.end,
	})

	return json(result)
}
