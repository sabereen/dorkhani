import { base } from '$app/paths'
import { db } from '$lib/server/db'
import { appSettings_store } from '$service/appSettings'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ request }) => {
	const etag = `"branding-${appSettings_store.config.branding.revision}-hero"`
	if (request.headers.get('if-none-match') === etag) {
		return new Response(null, { status: 304, headers: { etag } })
	}
	const asset = await db.tAppSettings.findUnique({
		where: { id: 1 },
		select: { heroImage: true, heroImageMime: true },
	})
	if (!asset?.heroImage || !asset.heroImageMime) {
		return new Response(null, {
			status: 307,
			headers: { location: `${base}/hero.png`, 'cache-control': 'public, max-age=3600' },
		})
	}
	return new Response(new Uint8Array(asset.heroImage), {
		headers: {
			'content-type': asset.heroImageMime,
			'cache-control': 'public, max-age=31536000, immutable',
			'x-content-type-options': 'nosniff',
			etag,
		},
	})
}
