import { base } from '$app/paths'
import { page } from '$app/state'

/**
 * یک مسیر نسبی از ریشه‌ی سایت می‌گیرد و یک یوآرال کامل بر می‌گرداند
 * @param path
 * @returns
 */
export function rebaseFullPath(path = '') {
	path = path.replace(/^\/?/, '/')
	const url = new URL(base + path, page.url)
	return url.href
}
