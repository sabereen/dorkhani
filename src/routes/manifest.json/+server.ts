import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { base } from '$app/paths'
import { getPublicBranding } from '$lib/entity/Branding'
import { localeDirection } from '$lib/i18n/locale'
import { getLocale, localizeHref } from '$lib/paraglide/runtime.js'
import * as m from '$lib/paraglide/messages.js'
import { appSettings_store } from '$service/appSettings'

export const GET: RequestHandler = () => {
	const locale = getLocale()
	const branding = getPublicBranding(appSettings_store.config.branding, locale, base)
	const appRoot = `${base}/`
	return json(
		{
			id: appRoot,
			name: branding.name,
			short_name: branding.name,
			description: m.manifest_description(),
			lang: locale,
			dir: localeDirection(locale),
			theme_color: '#f7f5ef',
			background_color: '#f7f5ef',
			display: 'standalone',
			scope: appRoot,
			start_url: localizeHref(appRoot),
			icons: [
				{
					src: branding.icon192Url,
					sizes: '192x192',
					type: 'image/png',
					purpose: 'any',
				},
				{
					src: branding.icon512Url,
					sizes: '512x512',
					type: 'image/png',
					purpose: 'any',
				},
				{
					src: branding.icon512Url,
					sizes: '512x512',
					type: 'image/png',
					purpose: 'maskable',
				},
			],
		},
		{
			headers: {
				'cache-control': 'no-cache',
				'content-type': 'application/manifest+json',
			},
		},
	)
}
