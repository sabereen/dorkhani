import { userNotification_setEndpointCanSend } from '$service/user-notification'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, { message: 'ابتدا وارد حساب کاربری شوید.' })

	const result = await userNotification_setEndpointCanSend(locals.user.id, 'eitaa', true)
	if (result.count === 0) {
		error(409, { message: 'حساب ایتای متصلی برای فعال‌سازی اعلان‌ها پیدا نشد.' })
	}

	return json({ enabled: true })
}
