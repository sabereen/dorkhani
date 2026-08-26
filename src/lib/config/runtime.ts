import { base } from '$app/paths'
import { PUBLIC_BUILD_TARGET, PUBLIC_SERVER_ORIGIN } from '$env/static/public'

export type BuildTarget = 'web' | 'capacitor'

export const buildTarget: BuildTarget =
	PUBLIC_BUILD_TARGET === 'capacitor' ? 'capacitor' : 'web'
export const isCapacitorBuild = buildTarget === 'capacitor'

const configuredServerOrigin = PUBLIC_SERVER_ORIGIN?.replace(/\/$/, '') || ''

export function withBasePath(path: string, basePath = '') {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	return basePath && (normalizedPath === basePath || normalizedPath.startsWith(`${basePath}/`))
		? normalizedPath
		: `${basePath}${normalizedPath}`
}

export function resolveServerUrl(
	path: string,
	options: {
		target: BuildTarget
		serverOrigin?: string
		currentOrigin?: string
		basePath?: string
	},
) {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	const basePath = options.basePath || ''
	if (options.target === 'capacitor') {
		if (!options.serverOrigin) throw new Error('PUBLIC_SERVER_ORIGIN is required for capacitor.')
		return new URL(normalizedPath, options.serverOrigin).href
	}
	const webPath = withBasePath(normalizedPath, basePath)
	if (options.currentOrigin) return new URL(webPath, options.currentOrigin).href
	return webPath
}

export function serverUrl(path: string, currentOrigin?: string) {
	return resolveServerUrl(path, {
		target: buildTarget,
		serverOrigin: configuredServerOrigin,
		currentOrigin,
		basePath: base,
	})
}

export function apiUrl(path: string, currentOrigin?: string) {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	return serverUrl(`/api${normalizedPath}`, currentOrigin)
}

export function publicWebUrl(path = '/', currentOrigin?: string) {
	const publicPath = withBasePath(path, base)
	if (configuredServerOrigin) return new URL(publicPath, configuredServerOrigin).href
	if (currentOrigin) return new URL(publicPath, currentOrigin).href
	if (typeof location !== 'undefined') return new URL(publicPath, location.origin).href
	return publicPath
}
