import { base } from '$app/paths'
import { env } from '$env/dynamic/private'
import { userNotification_enableEndpointFromProvider } from '$service/user-notification'
import { json, type RequestHandler } from '@sveltejs/kit'
import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

const updateSchema = z.object({
	message: z
		.object({
			text: z.string().optional(),
			chat: z.object({ id: z.union([z.number(), z.string()]) }),
			from: z.object({ id: z.union([z.number(), z.string()]) }).optional(),
		})
		.optional(),
})

function validSecret(received: string) {
	const expected = env.BALE_WEBHOOK_SECRET || ''
	const receivedBuffer = Buffer.from(received)
	const expectedBuffer = Buffer.from(expected)
	return (
		expectedBuffer.length >= 32 &&
		receivedBuffer.length === expectedBuffer.length &&
		timingSafeEqual(receivedBuffer, expectedBuffer)
	)
}

async function sendWelcome(chatId: string) {
	if (!env.BALE_BOT_TOKEN) return
	const origin = env.ORIGIN || env.BETTER_AUTH_URL
	if (!origin) return
	const appUrl = new URL(`${base}/`, origin).href
	await fetch(`https://tapi.bale.ai/bot${env.BALE_BOT_TOKEN}/sendMessage`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			text: 'برای ورود به سامانه ختم جمعی قرآن، برنامه را باز کنید.',
			reply_markup: {
				inline_keyboard: [[{ text: 'باز کردن برنامه', web_app: { url: appUrl } }]],
			},
		}),
	})
}

export const POST: RequestHandler = async ({ params, request }) => {
	if (!validSecret(params.secret)) return json({ ok: false }, { status: 404 })

	const parsed = updateSchema.safeParse(await request.json().catch(() => null))
	if (!parsed.success || !parsed.data.message) return json({ ok: true })

	const message = parsed.data.message
	const chatId = String(message.chat.id)
	const senderId = String(message.from?.id ?? message.chat.id)
	if (message.text?.startsWith('/start')) {
		await userNotification_enableEndpointFromProvider('bale', senderId)
	}

	await sendWelcome(chatId).catch((error) => {
		console.error('Failed to send Bale bot welcome message.', error)
	})
	return json({ ok: true })
}
