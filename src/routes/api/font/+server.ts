import { COUNT_OF_PAGES } from '@ghoran/metadata/constants'
import { error, type RequestHandler } from '@sveltejs/kit'

const cache = new Map<string, Promise<Blob>>()

export const GET: RequestHandler = async ({ url }) => {
	const font = url.searchParams.get('font') as 'qpc-v1' | 'qpc-v2'
	const page = parseInt(url.searchParams.get('page') || '0')

	if (!isFinite(page) || page <= 0 || page > COUNT_OF_PAGES) throw error(400)
	if (font !== 'qpc-v1' && font !== 'qpc-v2') throw error(400)

	const key = `${font}:${page}`

	let promise = cache.get(key)
	if (!promise) {
		const src = `https://unpkg.com/@ghoran/font-page@latest/fonts/${font}/woff2/p${page}.woff2`
		promise = fetch(src).then((r) => r.blob())
		cache.set(key, promise)
	}

	const blob = await promise
	return new Response(blob)
}
