import { appSettings_store } from '$service/appSettings'
import { env } from '$env/dynamic/private'
import { base } from '$app/paths'
import { getPublicBranding } from '$lib/entity/Branding'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = ({ locals }) => {
	const { supportLink, branding } = appSettings_store.config

	return {
		supportLink,
		branding: getPublicBranding(branding, base),
		user: locals.user
			? { id: locals.user.id, name: locals.user.name, image: locals.user.image }
			: null,
		authProviders: {
			google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
			eitaa: Boolean(env.EITAA_APP_TOKEN),
			bale: Boolean(env.BALE_BOT_TOKEN),
		},
	}
}
