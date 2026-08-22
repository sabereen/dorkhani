import { base } from '$app/paths'
import { db } from '$lib/server/db'
import { appSettings_store } from '$service/appSettings'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, request }) => {
	if (params.size !== '192' && params.size !== '512') return new Response(null, { status: 404 })
	const etag = `"branding-${appSettings_store.config.branding.revision}-icon-${params.size}"`
	if (request.headers.get('if-none-match') === etag) {
		return new Response(null, { status: 304, headers: { etag } })
	}
	const data =
		params.size === '192'
			? (
					await db.tAppSettings.findUnique({
						where: { id: 1 },
						select: { appIcon192: true },
					})
				)?.appIcon192
			: (
					await db.tAppSettings.findUnique({
						where: { id: 1 },
						select: { appIcon512: true },
					})
				)?.appIcon512
	if (!data) {
		return new Response(null, {
			status: 307,
			headers: {
				location: `${base}/icon-${params.size}.png`,
				'cache-control': 'public, max-age=3600',
			},
		})
	}
	return new Response(new Uint8Array(data), {
		headers: {
			'content-type': 'image/png',
			'cache-control': 'public, max-age=31536000, immutable',
			'x-content-type-options': 'nosniff',
			etag,
		},
	})
}
