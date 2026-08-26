import { getKhatmPath } from '$lib/utility/khatmPath'
import { publicWebUrl } from '$lib/config/runtime'
import { khatmService_countSitemapEntries, khatmService_getSitemapEntries } from '$service/khatm'
import { zekrService_getSitemapEntries } from '$service/zekr'
import type { Locale } from '$lib/paraglide/runtime.js'
import type { RequestHandler } from './$types'

const CHUNK_SIZE = 10_000
const STATIC_PATHS = ['/', '/list', '/privacy', '/terms']
const LOCALES: Locale[] = ['fa', 'ar', 'en']
const STATIC_URLS = STATIC_PATHS.flatMap((path) => LOCALES.map((locale) => localizePath(path, locale)))

export const GET: RequestHandler = async ({ params, url }) => {
	const page = Number(params.page)
	if (!Number.isSafeInteger(page) || page < 1) return new Response(null, { status: 404 })
	const start = (page - 1) * CHUNK_SIZE
	const khatmCount = await khatmService_countSitemapEntries()
	const urls = await collectUrls(start, CHUNK_SIZE, khatmCount)
	if (urls.length === 0) {
		return new Response(null, { status: 404 })
	}
	const body = urls
		.map((path) => `<url><loc>${escapeXml(publicWebUrl(path, url.origin))}</loc></url>`)
		.join('')
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`,
		{ headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } },
	)
}

async function collectUrls(start: number, limit: number, khatmCount: number) {
	const urls: string[] = []
	let position = start
	if (position < STATIC_URLS.length) {
		const staticUrls = STATIC_URLS.slice(position, position + limit)
		urls.push(...staticUrls)
		position += staticUrls.length
	}
	if (urls.length === limit) return urls

	const khatmPosition = position - STATIC_URLS.length
	if (khatmPosition < khatmCount * LOCALES.length) {
		const recordStart = Math.max(0, Math.floor(khatmPosition / LOCALES.length))
		const recordOffset = Math.max(0, khatmPosition % LOCALES.length)
		const recordsNeeded = Math.ceil((limit - urls.length + recordOffset) / LOCALES.length)
		const khatms = await khatmService_getSitemapEntries({ skip: recordStart, take: recordsNeeded })
		const khatmPaths = khatms.flatMap((khatm) =>
			LOCALES.map((locale) => localizePath(getKhatmPath({ ...khatm, accessToken: null }), locale)),
		)
		const selected = khatmPaths.slice(recordOffset, recordOffset + limit - urls.length)
		urls.push(...selected)
		position += selected.length
	}
	if (urls.length === limit) return urls

	const zekrPosition = position - STATIC_URLS.length - khatmCount * LOCALES.length
	if (zekrPosition < 0) return urls
	const zekrStart = Math.floor(zekrPosition / LOCALES.length)
	const zekrOffset = zekrPosition % LOCALES.length
	const zekrs = await zekrService_getSitemapEntries({
		skip: zekrStart,
		take: Math.ceil((limit - urls.length + zekrOffset) / LOCALES.length),
	})
	urls.push(
		...zekrs
			.flatMap((zekr) => LOCALES.map((locale) => localizePath(`/z${zekr.id}`, locale)))
			.slice(zekrOffset, zekrOffset + limit - urls.length),
	)
	return urls
}

function localizePath(path: string, locale: Locale) {
	return locale === 'fa' ? path : `/${locale}${path}`
}

function escapeXml(value: string) {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
