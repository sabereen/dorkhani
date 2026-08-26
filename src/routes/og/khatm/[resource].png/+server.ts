import { base } from '$app/paths'
import { error, type RequestHandler } from '@sveltejs/kit'
import { isLocale, type Locale } from '$lib/i18n/locale'
import { getPublicBranding } from '$lib/entity/Branding'
import { renderShareCard } from '$lib/server/seo/shareCard'
import { appSettings_store } from '$service/appSettings'
import { khatmService_getBySeriesRecord, khatmService_getFullRecord } from '$service/khatm'

export const GET: RequestHandler = async ({ locals, params, url }) => {
	const match = /^(a|k)(s?)(\d+)$/.exec(params.resource)
	if (!match) error(404)
	const accessToken = url.searchParams.get('t') || null
	const khatm = match[2]
		? await khatmService_getBySeriesRecord(Number(match[3]), accessToken)
		: await khatmService_getFullRecord(Number(match[3]), accessToken)
	if (
		!khatm ||
		(match[2] === 's') !== (khatm.seriesId != null) ||
		(match[1] === 'a') !== (khatm.rangeType === 'ayah')
	) {
		error(404)
	}

	const locale = readLocale(url.searchParams.get('l'), locals.locale)
	const branding = getPublicBranding(appSettings_store.config.branding, locale, base)
	const image = await renderShareCard({
		brand: branding.name,
		title: khatm.title,
		description: khatm.description,
		locale,
		progress: khatm.pageProgress,
		badge: rangeTypeLabel(khatm.rangeType, locale),
		completed: khatm.status === 'completed',
	})
	return new Response(image, {
		headers: {
			'content-type': 'image/png',
			'cache-control': khatm.private ? 'private, no-store' : 'public, max-age=31536000, immutable',
			'x-content-type-options': 'nosniff',
			'x-robots-tag': 'noindex, noimageindex',
		},
	})
}

function readLocale(value: string | null, fallback: Locale) {
	return isLocale(value) ? value : fallback
}

function rangeTypeLabel(rangeType: string, locale: Locale) {
	const labels = {
		fa: { free: 'بازهٔ آزاد', juz: 'جزء به جزء', hizbQuarter: 'حزب به حزب', page: 'صفحه به صفحه', surah: 'سوره به سوره', ayah: 'آیه به آیه' },
		ar: { free: 'نطاق حر', juz: 'جزء بجزء', hizbQuarter: 'حزب بحزب', page: 'صفحة بصفحة', surah: 'سورة بسورة', ayah: 'آية بآية' },
		en: { free: 'Flexible range', juz: 'By juz', hizbQuarter: 'By hizb', page: 'By page', surah: 'By surah', ayah: 'By verse' },
	}
	return labels[locale][rangeType as keyof (typeof labels)['fa']] || labels[locale].free
}
