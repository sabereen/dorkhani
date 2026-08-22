import { base } from '$app/paths'
import { env } from '$env/dynamic/private'
import type { AppBootstrap } from '$lib/contracts/api'
import { getPublicBranding } from '$lib/entity/Branding'
import { appSettings_store } from '$service/appSettings'
import { json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = ({ locals, url }) => {
	const { supportLink, branding } = appSettings_store.config
	const publicBranding = getPublicBranding(branding, locals.locale, base)
	const absoluteBranding = {
		...publicBranding,
		heroImageUrl: new URL(publicBranding.heroImageUrl, url.origin).href,
		icon192Url: new URL(publicBranding.icon192Url, url.origin).href,
		icon512Url: new URL(publicBranding.icon512Url, url.origin).href,
	}

	return json({
		locale: locals.locale,
		needsLocaleChoice: locals.needsLocaleChoice,
		supportLink,
		branding: absoluteBranding,
		user: locals.user
			? {
					id: locals.user.id,
					name: locals.user.name,
					image: locals.user.image,
					locale: locals.user.locale,
				}
			: null,
		authProviders: {
			google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
			eitaa: Boolean(env.EITAA_APP_TOKEN),
			bale: Boolean(env.BALE_BOT_TOKEN),
		},
	} satisfies AppBootstrap)
}
