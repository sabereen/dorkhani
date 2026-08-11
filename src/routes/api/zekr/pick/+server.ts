import { zekrService_pick } from '$service/zekr'
import { error, json, type RequestHandler } from '@sveltejs/kit'
import { userNotification_notify } from '$service/user-notification'

type Body = {
	zekrId: number
	count: number
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const body: Body = await request.json()

	if (typeof body.zekrId !== 'number' || body.count < 1 || Math.floor(body.count) !== body.count) {
		throw error(400, 'ورودی معتبر نیست')
	}

	if (body.count > 1000) {
		throw error(400, { message: 'حداکثر عدد قابل قبول ۱۰۰۰ است.' })
	}

	const count = Math.floor(body.count)

	const result = await zekrService_pick({
		id: body.zekrId,
		count,
	})
	userNotification_notify(locals.user?.id, {
		type: 'participationPicked',
		title: result.title,
		description: `${count.toLocaleString('fa-IR')} مرتبه ذکر برای شما ثبت شد.`,
		targetPath: `/z${result.id}`,
	})

	return json(result)
}
