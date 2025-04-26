import { getNotificationProvider } from '$service/admin-notification'
import { appSettingsService_init } from '$service/appSettings'
import type { ServerInit, HandleServerError } from '@sveltejs/kit'

export const init: ServerInit = async () => {
	await appSettingsService_init()
}

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	getNotificationProvider()
		.sendError(message, {
			status,
			href: event.url.href,
			error: String(error),
		})
		.catch(() => {})

	return {
		message,
	}
}
