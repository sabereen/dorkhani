import { base } from '$app/paths'
import { env } from '$env/dynamic/private'
import { authEmail_isConfigured, authEmail_send } from '$lib/server/auth/email'
import { db } from '$lib/server/db'

export type UserNotificationChannel = 'bale' | 'eitaa' | 'email'

export type UserNotificationEvent =
	| {
			type: 'khatmCreated'
			khatmId: number
			title: string
			private: boolean
			khatmPath: string
	  }
	| {
			type: 'participationPicked'
			title: string
			description: string
			targetPath: string
	  }
	| {
			type: 'roundCompleted'
			khatmId: number
			title: string
			roundNumber: number
			seriesId: number | null
	  }
	| {
			type: 'seriesCompleted'
			khatmId: number
			title: string
			roundNumber: number
	  }

type NotificationMessage = {
	subject: string
	text: string
	url: string
	forward?: {
		text: string
		url: string
	}
}

type NotificationSettingsInput = {
	enabled: boolean
	preferredChannel: UserNotificationChannel | null
	baleEnabled: boolean
	eitaaEnabled: boolean
	emailEnabled: boolean
}

const defaultPriority: UserNotificationChannel[] = ['bale', 'eitaa', 'email']
const PROVIDER_TIMEOUT_MS = 5000

function fullUrl(path: string) {
	const origin = env.ORIGIN || env.BETTER_AUTH_URL
	if (!origin) throw new Error('ORIGIN or BETTER_AUTH_URL must be configured for notifications.')
	return new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`, origin).href
}

function toMessage(event: UserNotificationEvent): NotificationMessage {
	switch (event.type) {
		case 'khatmCreated': {
			const khatmUrl = fullUrl(event.khatmPath)
			return {
				subject: 'ختم شما ایجاد شد',
				text: `ختم «${event.title}» با موفقیت ایجاد شد.${event.private ? ' این ختم خصوصی است.' : ''}`,
				url: fullUrl(`/account/khatms/${event.khatmId}/edit`),
				forward: {
					url: khatmUrl,
					text: [
						'🌙 دعوت به یک ختم جمعی قرآن',
						'',
						`ختم «${event.title}» آغاز شده است.`,
						'برای همراهی در این کار خیر، از طریق لینک زیر به جمع ما بپیوندید و سهمی از تلاوت قرآن را بر عهده بگیرید:',
						'',
						`🔗 لینک پیوستن به ختم:\n${khatmUrl}`,
						'',
						'این پیام را برای دوستان و عزیزانتان فوروارد کنید تا در این ثواب جمعی همراه شوند. 🤍',
					].join('\n'),
				},
			}
		}
		case 'participationPicked':
			return {
				subject: 'سهم شما ثبت شد',
				text: `سهم شما در «${event.title}» ثبت شد.\n${event.description}`,
				url: fullUrl(event.targetPath),
			}
		case 'roundCompleted':
			return {
				subject: 'یک دور از ختم شما کامل شد',
				text: `دور ${event.roundNumber.toLocaleString('fa-IR')} از ختم «${event.title}» کامل شد.`,
				url: fullUrl('/account'),
			}
		case 'seriesCompleted':
			return {
				subject: 'دنباله ختم شما به پایان رسید',
				text: `دنباله ختم «${event.title}» پس از ${event.roundNumber.toLocaleString('fa-IR')} دور به پایان رسید.`,
				url: fullUrl('/account'),
			}
	}
}

async function requestJson(url: string, body: object) {
	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
			signal: controller.signal,
		})
		const result = await response.json().catch(() => null)
		if (!response.ok || result?.ok === false)
			throw new Error(result?.description || `HTTP ${response.status}`)
	} finally {
		clearTimeout(timer)
	}
}

async function sendBale(address: string, message: NotificationMessage) {
	if (!env.BALE_BOT_TOKEN) throw new Error('BALE_BOT_TOKEN is not configured.')
	await requestJson(`https://tapi.bale.ai/bot${env.BALE_BOT_TOKEN}/sendMessage`, {
		chat_id: address,
		text: `${message.subject}\n\n${message.text}`,
		reply_markup: {
			inline_keyboard: [[{ text: 'باز کردن برنامه', web_app: { url: message.url } }]],
		},
	})

	if (message.forward) {
		try {
			await requestJson(`https://tapi.bale.ai/bot${env.BALE_BOT_TOKEN}/sendMessage`, {
				chat_id: address,
				text: message.forward.text,
				reply_markup: {
					inline_keyboard: [[{ text: 'پیوستن به ختم', url: message.forward.url }]],
				},
			})
		} catch (error) {
			console.error('Failed to send Bale khatm forwarding message.', error)
		}
	}
}

async function sendEitaa(address: string, message: NotificationMessage) {
	if (!env.EITAA_APP_TOKEN) throw new Error('EITAA_APP_TOKEN is not configured.')
	await requestJson(`https://eitaayar.ir/api/${env.EITAA_APP_TOKEN}/sendMessage`, {
		chat_id: address,
		text: `${message.subject}\n\n${message.text}\n\n${message.url}`,
	})

	if (message.forward) {
		try {
			await requestJson(`https://eitaayar.ir/api/${env.EITAA_APP_TOKEN}/sendMessage`, {
				chat_id: address,
				text: message.forward.text,
			})
		} catch (error) {
			console.error('Failed to send Eitaa khatm forwarding message.', error)
		}
	}
}

function getChannelPriority(preferredChannel: UserNotificationChannel | null) {
	if (!preferredChannel) return defaultPriority
	return [preferredChannel, ...defaultPriority.filter((channel) => channel !== preferredChannel)]
}

export async function userNotification_getSettings(userId: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		include: { notificationPreference: true, notificationEndpoints: true },
	})
	if (!user) return null

	const preference = user.notificationPreference
	const endpoints = new Map(
		user.notificationEndpoints.map((endpoint) => [endpoint.channel, endpoint]),
	)
	const emailAvailable =
		user.emailVerified && !user.email.endsWith('@users.invalid') && authEmail_isConfigured()

	return {
		enabled: preference?.enabled ?? true,
		preferredChannel: (preference?.preferredChannel as UserNotificationChannel | null) ?? null,
		channels: {
			bale: {
				enabled: preference?.baleEnabled ?? true,
				available: Boolean(endpoints.get('bale')?.canSend && env.BALE_BOT_TOKEN),
				connected: endpoints.has('bale'),
			},
			eitaa: {
				enabled: preference?.eitaaEnabled ?? true,
				available: Boolean(endpoints.get('eitaa')?.canSend && env.EITAA_APP_TOKEN),
				connected: endpoints.has('eitaa'),
			},
			email: {
				enabled: preference?.emailEnabled ?? true,
				available: emailAvailable,
				connected: user.emailVerified && !user.email.endsWith('@users.invalid'),
			},
		},
	}
}

export async function userNotification_saveSettings(
	userId: string,
	input: NotificationSettingsInput,
) {
	return db.notificationPreference.upsert({
		where: { userId },
		create: { userId, ...input },
		update: input,
	})
}

export async function userNotification_upsertEndpoint(
	userId: string,
	channel: Exclude<UserNotificationChannel, 'email'>,
	address: string,
	canSend: boolean | undefined,
) {
	return db.notificationEndpoint.upsert({
		where: { userId_channel: { userId, channel } },
		create: { userId, channel, address, canSend: canSend === true },
		update: { address, ...(canSend == null ? {} : { canSend }) },
	})
}

export async function userNotification_enableEndpointFromProvider(
	channel: Exclude<UserNotificationChannel, 'email'>,
	address: string,
) {
	const account = await db.account.findUnique({
		where: { providerId_accountId: { providerId: channel, accountId: address } },
	})
	if (!account) return false
	await userNotification_upsertEndpoint(account.userId, channel, address, true)
	return true
}

export async function userNotification_send(userId: string, event: UserNotificationEvent) {
	const user = await db.user.findUnique({
		where: { id: userId },
		include: { notificationPreference: true, notificationEndpoints: true },
	})
	if (!user || user.notificationPreference?.enabled === false) return

	const preference = user.notificationPreference
	const endpoints = new Map(
		user.notificationEndpoints.map((endpoint) => [endpoint.channel, endpoint]),
	)
	const message = toMessage(event)
	const enabled = {
		bale: preference?.baleEnabled ?? true,
		eitaa: preference?.eitaaEnabled ?? true,
		email: preference?.emailEnabled ?? true,
	}

	for (const channel of getChannelPriority(
		preference?.preferredChannel as UserNotificationChannel | null,
	)) {
		if (!enabled[channel]) continue
		try {
			if (channel === 'bale') {
				const endpoint = endpoints.get('bale')
				if (!endpoint?.canSend) continue
				await sendBale(endpoint.address, message)
			} else if (channel === 'eitaa') {
				const endpoint = endpoints.get('eitaa')
				if (!endpoint?.canSend) continue
				await sendEitaa(endpoint.address, message)
			} else {
				if (
					!user.emailVerified ||
					user.email.endsWith('@users.invalid') ||
					!authEmail_isConfigured()
				)
					continue
				await authEmail_send(user.email, message.subject, `${message.text}\n\n${message.url}`)
			}
			return
		} catch (error) {
			console.error(`Failed to send ${channel} user notification.`, error)
		}
	}
}

export function userNotification_notify(
	userId: string | null | undefined,
	event: UserNotificationEvent,
) {
	if (!userId) return
	void userNotification_send(userId, event).catch((error) => {
		console.error('Failed to dispatch user notification.', error)
	})
}
