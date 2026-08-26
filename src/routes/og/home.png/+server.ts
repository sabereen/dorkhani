import { base } from '$app/paths'
import { isLocale, type Locale } from '$lib/i18n/locale'
import { getPublicBranding } from '$lib/entity/Branding'
import { renderShareCard } from '$lib/server/seo/shareCard'
import { appSettings_store } from '$service/appSettings'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals, url }) => {
	const locale = readLocale(url.searchParams.get('l'), locals.locale)
	const branding = getPublicBranding(appSettings_store.config.branding, locale, base)
	const image = await renderShareCard({
		brand: branding.name,
		title: branding.heroTitle,
		description: branding.heroDescription,
		locale,
	})
	return new Response(image, { headers: ogHeaders('public, max-age=31536000, immutable') })
}

function readLocale(value: string | null, fallback: Locale) {
	return isLocale(value) ? value : fallback
}

function ogHeaders(cacheControl: string) {
	return {
		'content-type': 'image/png',
		'cache-control': cacheControl,
		'x-content-type-options': 'nosniff',
		'x-robots-tag': 'noindex, noimageindex',
	}
}
