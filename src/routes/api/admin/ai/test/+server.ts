import { auth_ensureIsAdmin } from '$service/auth'
import { appSettings_store } from '$service/appSettings'
import { aiKhatmReview_testConnection } from '$service/aiKhatmReview'
import { json, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async (event) => {
	auth_ensureIsAdmin(event)

	const body: {
		baseUrl?: unknown
		model?: unknown
		apiKey?: unknown
	} = await event.request.json().catch(() => ({}))
	const baseUrl = typeof body.baseUrl === 'string' ? body.baseUrl.trim() : ''
	const model = typeof body.model === 'string' ? body.model.trim() : ''
	const apiKey =
		body.apiKey === 'unchanged'
			? appSettings_store.config.aiKhatmReview.apiKey || ''
			: typeof body.apiKey === 'string'
				? body.apiKey
				: ''

	if (!baseUrl) return json({ message: 'نشانی سرویس AI را وارد کنید.' }, { status: 400 })
	try {
		new URL(baseUrl)
	} catch {
		return json({ message: 'نشانی سرویس AI معتبر نیست.' }, { status: 400 })
	}
	if (!model || !apiKey) {
		return json({ message: 'مدل و کلید API را وارد کنید.' }, { status: 400 })
	}

	try {
		await aiKhatmReview_testConnection({ baseUrl, model, apiKey })
		return json({ message: 'اتصال به سرویس AI با موفقیت برقرار شد.' })
	} catch (error) {
		console.warn('AI connection test failed.', error)
		const reason = error instanceof Error ? ` ${error.message}` : ''
		return json({ message: `اتصال به سرویس AI برقرار نشد.${reason}` }, { status: 502 })
	}
}
