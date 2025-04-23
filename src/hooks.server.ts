import { appSettingsService_init } from '$service/appSettings'
import type { ServerInit } from '@sveltejs/kit'

export const init: ServerInit = async () => {
	await appSettingsService_init()
}
