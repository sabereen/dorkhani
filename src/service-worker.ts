/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { base, build, files, version } from '$service-worker'

const worker = globalThis as unknown as ServiceWorkerGlobalScope
const CACHE_PREFIX = 'dorkhani-pwa'
const CACHE = `${CACHE_PREFIX}-${version}`
const OFFLINE_PAGE = `${base}/offline.html`
const PRECACHE = [...build, ...files]
const PRECACHE_PATHS = new Set(PRECACHE)

worker.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)))
})

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key.startsWith(`${CACHE_PREFIX}-`) && key !== CACHE)
						.map((key) => caches.delete(key)),
				),
		),
	)
})

worker.addEventListener('fetch', (event) => {
	const { request } = event
	if (request.method !== 'GET' || request.headers.has('range')) return

	const url = new URL(request.url)
	if (url.origin !== worker.location.origin) return

	if (PRECACHE_PATHS.has(url.pathname)) {
		event.respondWith(cacheFirst(url.pathname, request))
		return
	}

	if (request.mode === 'navigate') {
		event.respondWith(navigationWithOfflineFallback(request))
		return
	}

	if (isPublicRuntimeAsset(url.pathname)) {
		event.respondWith(networkFirst(request))
	}
})

async function cacheFirst(pathname: string, request: Request) {
	const cache = await caches.open(CACHE)
	const cached = await cache.match(pathname)
	return cached ?? fetch(request)
}

async function navigationWithOfflineFallback(request: Request) {
	try {
		return await fetch(request)
	} catch {
		const cache = await caches.open(CACHE)
		return (await cache.match(OFFLINE_PAGE)) ?? Response.error()
	}
}

async function networkFirst(request: Request) {
	const cache = await caches.open(CACHE)
	try {
		const response = await fetch(request)
		if (response.ok) await cache.put(request, response.clone())
		return response
	} catch {
		return (await cache.match(request)) ?? Response.error()
	}
}

function isPublicRuntimeAsset(pathname: string) {
	if (base && pathname !== base && !pathname.startsWith(`${base}/`)) return false
	const appPath = base ? pathname.slice(base.length) || '/' : pathname
	return /^\/branding\/(?:hero|icon\/(?:192|512))$/.test(appPath) || appPath === '/api/font'
}
