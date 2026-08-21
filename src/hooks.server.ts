import { building } from '$app/environment'
import { getNotificationProvider } from '$service/admin-notification'
import { appSettingsService_init } from '$service/appSettings'
import { khatmCleanup_startScheduler } from '$service/khatmCleanup'
import { aiKhatmReview_startScheduler } from '$service/aiKhatmReview'
import type { ServerInit, HandleServerError, Handle } from '@sveltejs/kit'
import { isManualColorScheme } from '$lib/entity/Theme'
import { auth } from '$lib/server/auth'
import { svelteKitHandler } from 'better-auth/svelte-kit'

export const init: ServerInit = async () => {
	await appSettingsService_init()
	if (!building) {
		khatmCleanup_startScheduler()
		aiKhatmReview_startScheduler()
	}
}

export const handle: Handle = async ({ resolve, event }) => {
	const authSession = await auth.api.getSession({ headers: event.request.headers })
	event.locals.session = authSession?.session ?? null
	event.locals.user = authSession?.user ?? null

	const response = await svelteKitHandler({
		auth,
		event,
		building,
		resolve: (currentEvent) =>
			resolve(currentEvent, {
				transformPageChunk(input) {
					let html = input.html
					const colorScheme = currentEvent.cookies.get('colorScheme')
					if (isManualColorScheme(colorScheme)) {
						html = html.replace('<html', `<html data-color-scheme="${colorScheme}"`)
					}
					return html
				},
			}),
	})
	response.headers.delete('x-frame-options')
	if (!response.headers.has('content-security-policy')) {
		response.headers.set(
			'content-security-policy',
			"frame-ancestors 'self' https://*.bale.ai; frame-src 'self' https://*.bale.ai",
		)
	}
	return response
}

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	const details = getErrorDetails(error)
	const report = {
		status,
		name: details.name,
		message: details.message || message,
		method: event.request.method,
		path: event.url.pathname,
		url: event.url.href,
		stack: details.stack ?? null,
		cause: details.cause ?? null,
	}

	// This must remain enabled in production: Mini Apps cannot be inspected easily,
	// so the deployment log is the source of truth for unexpected request failures.
	console.error('Unhandled SvelteKit request error:', report)

	getNotificationProvider().sendError(`${status} ${report.message}`, report).catch((notificationError) => {
		console.error('Failed to send unexpected-error notification:', notificationError)
	})

	return {
		status,
		name: details.name,
		message: report.message,
		path: event.url.pathname,

		// Intentionally exposed in production so Mini App users can copy the exact failure.
		stack: details.stack,
		cause: details.cause,
	}
}

function serializeCause(cause: unknown): unknown {
	if (cause == null) return null

	if (cause instanceof Error) {
		return {
			name: cause.name,
			message: cause.message,
			stack: cause.stack,
			cause: serializeCause(cause.cause),
		}
	}

	if (typeof cause === 'object') {
		try {
			return JSON.parse(JSON.stringify(cause))
		} catch {
			return String(cause)
		}
	}

	return cause
}

function getErrorDetails(error: unknown) {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack,
			cause: serializeCause(error.cause),
		}
	}

	if (typeof error === 'object' && error !== null) {
		const errorLike = error as {
			name?: unknown
			message?: unknown
			stack?: unknown
			cause?: unknown
		}

		try {
			return {
				name:
					typeof errorLike.name === 'string'
						? errorLike.name
						: error.constructor?.name ?? 'UnknownError',
				message:
					typeof errorLike.message === 'string' ? errorLike.message : JSON.stringify(error),
				stack: typeof errorLike.stack === 'string' ? errorLike.stack : undefined,
				cause: serializeCause(errorLike.cause),
			}
		} catch {
			return {
				name: 'UnknownError',
				message: String(error),
				stack: undefined,
				cause: undefined,
			}
		}
	}

	return {
		name: 'UnknownError',
		message: String(error),
		stack: undefined,
		cause: undefined,
	}
}

// export const handleError: HandleServerError = ({ error, event, status }) => {
// 	const details = getErrorDetails(error)

// 	return {
// 		status,
// 		name: details.name,
// 		message: details.message,
// 		path: event.url.pathname,

// 		// فقط در development
// 		stack: dev ? details.stack : undefined,
// 		cause: dev ? details.cause : undefined,
// 	}
// }
