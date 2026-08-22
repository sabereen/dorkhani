import type { NotificationChannel } from '$lib/contracts/api'
import { userNotification_saveSettings } from '$service/user-notification'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, { message: 'ابتدا وارد حساب کاربری شوید.' })
	const body = await request.json().catch(() => null)
	const preferredChannel = body?.preferredChannel || null
	if (preferredChannel != null && !['bale', 'eitaa', 'email'].includes(preferredChannel)) {
		error(400, { message: 'کانال ترجیحی معتبر نیست.' })
	}
	await userNotification_saveSettings(locals.user.id, {
		enabled: body?.enabled === true,
		preferredChannel: preferredChannel as NotificationChannel | null,
		baleEnabled: body?.baleEnabled === true,
		eitaaEnabled: body?.eitaaEnabled === true,
		emailEnabled: body?.emailEnabled === true,
	})
	return json({ saved: true })
}
