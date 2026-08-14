import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { base } from '$app/paths'

export const GET: RequestHandler = () => {
	return json({
		name: 'ختم قرآن گروهی',
		short_name: 'ختم قرآن گروهی',
		theme_color: '#07110f',
		background_color: '#f7f5ef',
		display: 'standalone',
		orientation: 'portrait',
		scope: `${base}/`,
		start_url: `${base}/`,
		icons: [
			{
				src: `${base}/icon-192.png`,
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: `${base}/icon-512.png`,
				sizes: '512x512',
				type: 'image/png',
			},
		],
	})
}
