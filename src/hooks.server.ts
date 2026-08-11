import { browser, building, dev } from '$app/environment'
import { getNotificationProvider } from '$service/admin-notification'
import { appSettingsService_init } from '$service/appSettings'
import { khatmCleanup_startScheduler } from '$service/khatmCleanup'
import type { ServerInit, HandleServerError, Handle } from '@sveltejs/kit'
import { isManualColorScheme } from '$lib/entity/Theme'
import { auth } from '$lib/server/auth'
import { svelteKitHandler } from 'better-auth/svelte-kit'

export const init: ServerInit = async () => {
	await appSettingsService_init()
	if (!building) khatmCleanup_startScheduler()
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
	if (dev || browser) {
		console.error(error)
	}

	getNotificationProvider()
		.sendError(`${status} ${message}`, {
			href: event.url.href,
			error: String(error),
		})
		.catch(() => {})

	return {
		message,
	}
}
