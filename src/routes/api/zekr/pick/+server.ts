import { zekrService_pick } from '$service/zekr'
import { error, json, type RequestHandler } from '@sveltejs/kit'

type Body = {
	zekrId: number
	count: number
}

export const POST: RequestHandler = async ({ request }) => {
	const body: Body = await request.json()

	if (typeof body.zekrId !== 'number' || body.count < 0 || body.count > 40) {
		throw error(400, 'ورودی معتبر نیست')
	}

	const count = Math.floor(body.count)

	const result = await zekrService_pick({
		id: body.zekrId,
		count,
	})

	return json(result)
}
