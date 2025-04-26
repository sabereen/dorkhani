import { appSettings_store, appSettingsService_setKey } from '$service/appSettings'
import { auth_ensureIsAdmin } from '$service/auth'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = () => {
	const { supportLink, notification } = appSettings_store.config

	return {
		supportLink,
		notification: {
			...notification,
			eitaaToken: notification.eitaaToken ? 'unchanged' : '',
		},
	}
}

export const actions = {
	default: async (event) => {
		auth_ensureIsAdmin(event)

		const { config } = appSettings_store

		const form = await event.request.formData()

		const eitaa = form.get('eitaa') === 'on'
		const eitaaChatId = form.get('eitaaChatId')?.toString()
		const eitaaToken = form.get('eitaaToken')?.toString()
		const finalEitaaToken = eitaaToken === 'unchanged' ? config.notification.eitaaToken : eitaaToken

		const supportLink = form.get('supportLink')?.toString()
		if (supportLink !== config.supportLink) {
			await appSettingsService_setKey('supportLink', supportLink)
		}

		if (
			eitaa !== config.notification.eitaa ||
			eitaaToken !== 'unchanged' ||
			eitaaChatId !== config.notification.eitaaChatId
		) {
			await appSettingsService_setKey('notification', {
				eitaa: eitaa,
				eitaaChatId: eitaaChatId,
				eitaaToken: finalEitaaToken,
			})
		}

		return {
			supportLink,
			eitaa,
			eitaaChatId,
			eitaaToken,
		}
	},
} satisfies Actions
