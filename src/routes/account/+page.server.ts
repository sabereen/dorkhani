import { khatmService_getOwnedList } from '$service/khatm'
import {
	userNotification_getSettings,
	userNotification_saveSettings,
	type UserNotificationChannel,
} from '$service/user-notification'
import { base } from '$app/paths'
import { env } from '$env/dynamic/private'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, `${base}/auth/login`)
	const [khatms, notificationSettings] = await Promise.all([
		khatmService_getOwnedList(locals.user.id),
		userNotification_getSettings(locals.user.id),
	])
	return {
		user: {
			name: locals.user.name,
			email: locals.user.email.endsWith('@users.invalid') ? null : locals.user.email,
		},
		khatms,
		notificationSettings,
		messengerLinks: {
			bale: env.BALE_BOT_USERNAME ? `https://ble.ir/${env.BALE_BOT_USERNAME.replace(/^@/, '')}` : null,
			eitaa: env.EITAA_BOT_USERNAME
				? `https://eitaa.com/${env.EITAA_BOT_USERNAME.replace(/^@/, '')}`
				: null,
		},
	}
}

export const actions = {
	notifications: async ({ locals, request }) => {
		if (!locals.user) redirect(303, `${base}/auth/login`)
		const form = await request.formData()
		const preferredValue = String(form.get('preferredChannel') || '')
		const preferredChannel = preferredValue || null
		if (
			preferredChannel != null &&
			!(['bale', 'eitaa', 'email'] as const).includes(preferredChannel as UserNotificationChannel)
		) {
			return fail(400, { notificationError: 'کانال ترجیحی معتبر نیست.' })
		}

		await userNotification_saveSettings(locals.user.id, {
			enabled: form.get('enabled') === 'on',
			preferredChannel: preferredChannel as UserNotificationChannel | null,
			baleEnabled: form.get('baleEnabled') === 'on',
			eitaaEnabled: form.get('eitaaEnabled') === 'on',
			emailEnabled: form.get('emailEnabled') === 'on',
		})

		return { notificationSaved: true }
	},
} satisfies Actions
