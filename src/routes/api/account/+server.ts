import { env } from '$env/dynamic/private'
import type { AccountData } from '$lib/contracts/api'
import { khatmService_getOwnedList } from '$service/khatm'
import { userNotification_getSettings } from '$service/user-notification'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, { message: 'ابتدا وارد حساب کاربری شوید.' })
	const [khatms, notificationSettings] = await Promise.all([
		khatmService_getOwnedList(locals.user.id),
		userNotification_getSettings(locals.user.id),
	])
	return json({
		user: {
			name: locals.user.name,
			email: locals.user.email.endsWith('@users.invalid') ? null : locals.user.email,
		},
		khatms,
		notificationSettings,
		messengerLinks: {
			bale: env.BALE_BOT_USERNAME
				? `https://ble.ir/${env.BALE_BOT_USERNAME.replace(/^@/, '')}`
				: null,
			eitaa: env.EITAA_BOT_USERNAME
				? `https://eitaa.com/${env.EITAA_BOT_USERNAME.replace(/^@/, '')}`
				: null,
		},
	} satisfies AccountData)
}
