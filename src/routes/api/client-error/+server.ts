import { getNotificationProvider } from '$service/admin-notification'
import { json, type RequestHandler } from '@sveltejs/kit'

const MAX_FIELD_LENGTH = 20_000

export const POST: RequestHandler = async ({ request }) => {
	let payload: unknown

	try {
		payload = await request.json()
	} catch {
		return json({ message: 'Invalid client error report.' }, { status: 400 })
	}

	const report = normalizeReport(payload)
	if (!report) return json({ message: 'Invalid client error report.' }, { status: 400 })

	console.error('Unhandled client error:', report)

	getNotificationProvider().sendError(`Client ${report.status} ${report.message}`, report).catch((error) => {
		console.error('Failed to send client-error notification:', error)
	})

	return json({ ok: true })
}

function normalizeReport(payload: unknown) {
	if (typeof payload !== 'object' || payload === null) return null

	const value = payload as Record<string, unknown>
	const name = toString(value.name)
	const message = toString(value.message)
	const url = toString(value.url)
	const path = toString(value.path)
	if (!name || !message || !url || !path) return null

	return {
		source: toString(value.source) || 'unknown',
		status: typeof value.status === 'number' ? value.status : 500,
		name,
		message,
		stack: toNullableString(value.stack),
		cause: value.cause ?? null,
		url,
		path,
		filename: toNullableString(value.filename),
		line: typeof value.line === 'number' ? value.line : null,
		column: typeof value.column === 'number' ? value.column : null,
	}
}

function toString(value: unknown) {
	return typeof value === 'string' ? value.slice(0, MAX_FIELD_LENGTH) : ''
}

function toNullableString(value: unknown) {
	return typeof value === 'string' ? value.slice(0, MAX_FIELD_LENGTH) : null
}
