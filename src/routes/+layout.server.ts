import { appSettings_store } from '$service/appSettings'
import { env } from '$env/dynamic/private'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = ({ locals }) => {
	const { supportLink } = appSettings_store.config

	return {
		supportLink,
		user: locals.user
			? { id: locals.user.id, name: locals.user.name, image: locals.user.image }
			: null,
		authProviders: {
			google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
			eitaa: Boolean(env.EITAA_APP_TOKEN),
		},
	}
}
