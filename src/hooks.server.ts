import { getNotificationProvider } from '$service/admin-notification'
import { appSettingsService_init } from '$service/appSettings'
import type { ServerInit, HandleServerError, Handle } from '@sveltejs/kit'

export const init: ServerInit = async () => {
	await appSettingsService_init()
}

export const handle: Handle = async ({ resolve, event }) => {
	return resolve(event, {
		transformPageChunk(input) {
			let html = input.html
			const daisyTheme = event.cookies.get('daisyTheme')
			if (daisyTheme) {
				html = html.replace('<html', `<html data-theme="${daisyTheme}"`)
			}
			return html
		},
	})
}

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
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
