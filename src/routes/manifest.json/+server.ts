import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { base } from '$app/paths'
import { getPublicBranding } from '$lib/entity/Branding'
import { appSettings_store } from '$service/appSettings'

export const GET: RequestHandler = () => {
	const branding = getPublicBranding(appSettings_store.config.branding, base)
	return json(
		{
			name: branding.name,
			short_name: branding.name,
			theme_color: '#07110f',
			background_color: '#f7f5ef',
			display: 'standalone',
			orientation: 'portrait',
			scope: `${base}/`,
			start_url: `${base}/`,
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
