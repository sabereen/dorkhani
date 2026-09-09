import { publicWebUrl } from '$lib/config/runtime'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ url }) =>
	new Response(
		[
			'User-agent: *',
			'Allow: /',
			'Disallow: /account/',
			'Disallow: /add',
			'Disallow: /admin/',
			'Disallow: /api/',
			'Disallow: /auth/',
			'Disallow: /history',
			'Disallow: /native-admin',
			'Disallow: /offline-khatm',
			'Disallow: /settings',
			`Sitemap: ${publicWebUrl('/sitemap.xml', url.origin)}`,
			'',
		].join('\n'),
		{
			headers: {
				'content-type': 'text/plain; charset=utf-8',
				'cache-control': 'public, max-age=3600',
			},
		},
	)
