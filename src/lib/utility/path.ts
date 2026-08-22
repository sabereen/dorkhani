import { base } from '$app/paths'
import { page } from '$app/state'
import { localizeUrl } from '$lib/paraglide/runtime.js'

/**
 * یک مسیر نسبی از ریشه‌ی سایت می‌گیرد و یک یوآرال کامل بر می‌گرداند
 * @param path
 * @returns
 */
export function rebaseFullPath(path = '', origin = page.url.origin) {
	path = path.replace(/^\/?/, '/')
	const url = new URL(base + path, origin)
	return localizeUrl(url).href
}
