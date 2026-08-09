import { browser, dev } from '$app/environment'
import { getNotificationProvider } from '$service/admin-notification'
import { appSettingsService_init } from '$service/appSettings'
import type { ServerInit, HandleServerError, Handle } from '@sveltejs/kit'
import { isManualColorScheme } from '$lib/entity/Theme'

export const init: ServerInit = async () => {
	await appSettingsService_init()
}

export const handle: Handle = async ({ resolve, event }) => {
	return resolve(event, {
		transformPageChunk(input) {
			let html = input.html
			const colorScheme = event.cookies.get('colorScheme')
			if (isManualColorScheme(colorScheme)) {
				html = html.replace('<html', `<html data-color-scheme="${colorScheme}"`)
			}
			return html
		},
	})
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
