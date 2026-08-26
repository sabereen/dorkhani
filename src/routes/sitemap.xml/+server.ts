import { publicWebUrl } from '$lib/config/runtime'
import { khatmService_countSitemapEntries } from '$service/khatm'
import { zekrService_countSitemapEntries } from '$service/zekr'
import type { RequestHandler } from './$types'

const CHUNK_SIZE = 10_000
const STATIC_URL_COUNT = 4 * 3

export const GET: RequestHandler = async ({ url }) => {
	const [khatmCount, zekrCount] = await Promise.all([
		khatmService_countSitemapEntries(),
		zekrService_countSitemapEntries(),
	])
	const count = Math.max(1, Math.ceil((STATIC_URL_COUNT + (khatmCount + zekrCount) * 3) / CHUNK_SIZE))
	const entries = Array.from({ length: count }, (_, index) => {
		const location = escapeXml(publicWebUrl(`/sitemap/${index + 1}.xml`, url.origin))
		return `<sitemap><loc>${location}</loc></sitemap>`
	}).join('')
	return xml(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`)
}

function escapeXml(value: string) {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function xml(body: string) {
	return new Response(body, {
		headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
	})
}
