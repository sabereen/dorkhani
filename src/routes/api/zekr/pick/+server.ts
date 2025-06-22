import { zekrService_pick } from '$service/zekr'
import { error, json, type RequestHandler } from '@sveltejs/kit'

type Body = {
	zekrId: number
	count: number
}

export const POST: RequestHandler = async ({ request }) => {
	const body: Body = await request.json()

	if (typeof body.zekrId !== 'number' || body.count < 1 || Math.floor(body.count) !== body.count) {
		throw error(400, 'ورودی معتبر نیست')
	}

	if (body.count > 100) {
		throw error(400, { message: 'حداکثر عدد قابل قبول ۱۰۰ است.' })
	}

	const count = Math.floor(body.count)

	const result = await zekrService_pick({
		id: body.zekrId,
		count,
	})

	return json(result)
}
