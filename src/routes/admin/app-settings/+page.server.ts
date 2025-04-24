import { appSettings_store, appSettingsService_setKey } from '$service/appSettings'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = () => {
	const { supportLink } = appSettings_store.config

	return {
		supportLink,
	}
}

export const actions = {
	default: async (event) => {
		const form = await event.request.formData()
		const supportLink = form.get('supportLink')?.toString()
		if (supportLink !== appSettings_store.config.supportLink) {
			await appSettingsService_setKey('supportLink', supportLink)
		}

		return {
			supportLink,
		}
	},
} satisfies Actions
