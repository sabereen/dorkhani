import { base } from '$app/paths'
import { error, type RequestHandler } from '@sveltejs/kit'
import { isLocale, type Locale } from '$lib/i18n/locale'
import { getPublicBranding } from '$lib/entity/Branding'
import { renderShareCard } from '$lib/server/seo/shareCard'
import { appSettings_store } from '$service/appSettings'
import { zekrService_get } from '$service/zekr'

export const GET: RequestHandler = async ({ locals, params, url }) => {
	const id = Number(params.id)
	if (!Number.isSafeInteger(id) || id < 1) error(404)
	const zekr = await zekrService_get(id)
	if (!zekr) error(404)
	const locale = readLocale(url.searchParams.get('l'), locals.locale)
	const branding = getPublicBranding(appSettings_store.config.branding, locale, base)
	const finite = zekr.targetCount != null && zekr.targetCount > 0
	const progress = finite ? Math.min(100, (zekr.count / zekr.targetCount!) * 100) : undefined
	const image = await renderShareCard({
		brand: branding.name,
		title: zekr.title,
		description: zekr.description,
		locale,
		progress,
		badge: finite ? undefined : locale === 'en' ? 'Open collective zikr' : locale === 'ar' ? 'ذكر جماعي مفتوح' : 'ذکر جمعی باز',
		completed: finite && progress === 100,
	})
	return new Response(image, {
		headers: {
			'content-type': 'image/png',
			'cache-control': 'public, max-age=31536000, immutable',
			'x-content-type-options': 'nosniff',
			'x-robots-tag': 'noindex, noimageindex',
		},
	})
}

function readLocale(value: string | null, fallback: Locale) {
	return isLocale(value) ? value : fallback
}
