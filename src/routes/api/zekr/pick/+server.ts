import { zekrService_pick } from '$service/zekr'
import { error, json, type RequestHandler } from '@sveltejs/kit'
import { userNotification_notify } from '$service/user-notification'
import { formatNumber } from '$lib/i18n/format'
import * as m from '$lib/paraglide/messages.js'

type Body = {
	zekrId: number
	count: number
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const body: Body = await request.json()

	if (typeof body.zekrId !== 'number' || body.count < 1 || Math.floor(body.count) !== body.count) {
		throw error(400, { message: m.error_invalid_input(), code: 'invalid_input' })
	}

	if (body.count > 1000) {
		throw error(400, { message: m.error_max_1000(), code: 'count_too_large' })
	}

	const count = Math.floor(body.count)

	const result = await zekrService_pick({
		id: body.zekrId,
		count,
	})
	userNotification_notify(locals.user?.id, {
		type: 'participationPicked',
		title: result.title,
		description: m.notification_zikr_count({ count: formatNumber(count) }),
		targetPath: `/z${result.id}`,
	})

	return json(result)
}
