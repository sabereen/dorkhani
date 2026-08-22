import { base } from '$app/paths'
import { env } from '$env/dynamic/private'
import { auth_ensureIsAdmin } from '$service/auth'
import { json, type RequestHandler } from '@sveltejs/kit'

const PROVIDER_TIMEOUT_MS = 5000

async function setBaleWebhook(url: string) {
	if (!env.BALE_BOT_TOKEN) throw new Error('BALE_BOT_TOKEN is not configured.')

	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)
	try {
		const response = await fetch(`https://tapi.bale.ai/bot${env.BALE_BOT_TOKEN}/setWebhook`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ url }),
			signal: controller.signal,
		})
		const result = await response.json().catch(() => null)
		if (!response.ok || result?.ok === false) {
			throw new Error(result?.description || `HTTP ${response.status}`)
		}
	} finally {
		clearTimeout(timer)
	}
}

export const POST: RequestHandler = async (event) => {
	auth_ensureIsAdmin(event)

	const origin = env.ORIGIN || env.BETTER_AUTH_URL
	const secret = env.BALE_WEBHOOK_SECRET
	if (!origin) return json({ message: 'ORIGIN یا BETTER_AUTH_URL تنظیم نشده است.' }, { status: 400 })
	if (!secret || Buffer.byteLength(secret) < 32) {
		return json({ message: 'BALE_WEBHOOK_SECRET باید حداقل ۳۲ کاراکتر باشد.' }, { status: 400 })
	}

	let webhookUrl: string
	try {
		webhookUrl = new URL(`${base}/api/bale/webhook/${encodeURIComponent(secret)}`, origin).href
	} catch {
		return json({ message: 'نشانی سامانه برای تنظیم وب‌هوک معتبر نیست.' }, { status: 400 })
	}

	try {
		await setBaleWebhook(webhookUrl)
		return json({ message: 'وب‌هوک بله با موفقیت بررسی و تنظیم شد.' })
	} catch (error) {
		console.warn('Bale webhook setup failed.', error)
		const reason = error instanceof Error ? ` ${error.message}` : ''
		return json({ message: `تنظیم وب‌هوک بله انجام نشد.${reason}` }, { status: 502 })
	}
}
