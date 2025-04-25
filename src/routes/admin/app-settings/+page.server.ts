import { appSettings_store, appSettingsService_setKey } from '$service/appSettings'
import { auth_ensureIsAdmin } from '$service/auth'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = () => {
	const { supportLink, autoShowcase } = appSettings_store.config

	return {
		supportLink,
		autoShowcase,
	}
}

export const actions = {
	default: async (event) => {
		auth_ensureIsAdmin(event)

		const form = await event.request.formData()

		const autoShowcase = form.get('autoShowcase') === 'on'

		const supportLink = form.get('supportLink')?.toString()
		if (supportLink !== appSettings_store.config.supportLink) {
			await appSettingsService_setKey('supportLink', supportLink)
		}

		if (autoShowcase !== appSettings_store.config.autoShowcase) {
			await appSettingsService_setKey('autoShowcase', autoShowcase)
		}

		return {
			supportLink,
			autoShowcase,
		}
	},
} satisfies Actions
