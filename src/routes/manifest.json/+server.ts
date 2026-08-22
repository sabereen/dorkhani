import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { base } from '$app/paths'
import { getPublicBranding } from '$lib/entity/Branding'
import { getLocale, localizeHref } from '$lib/paraglide/runtime.js'
import * as m from '$lib/paraglide/messages.js'
import { appSettings_store } from '$service/appSettings'

export const GET: RequestHandler = () => {
	const branding = getPublicBranding(appSettings_store.config.branding, getLocale(), base)
	return json(
		{
			name: branding.name,
			short_name: branding.name,
			description: m.manifest_description(),
			theme_color: '#07110f',
			background_color: '#f7f5ef',
			display: 'standalone',
			orientation: 'portrait',
			scope: localizeHref(`${base}/`),
			start_url: localizeHref(`${base}/`),
			icons: [
				{
					src: branding.icon192Url,
					sizes: '192x192',
					type: 'image/png',
				},
				{
					src: branding.icon512Url,
					sizes: '512x512',
					type: 'image/png',
				},
			],
		},
		{ headers: { 'cache-control': 'no-cache' } },
	)
}
