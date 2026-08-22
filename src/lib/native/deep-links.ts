export const ANDROID_APP_LINK_ORIGIN = 'https://dorkhani.ir'

const contentRoute = /^\/(?:ks?|as?|z)\d+(?:\/.*)?$/
const namedRoute = /^\/(?:list|add|history|settings|account|auth)(?:\/.*)?$/

export function isNativeAppPath(pathname: string) {
	const unlocalized = pathname.replace(/^\/(?:ar|en)(?=\/|$)/, '') || '/'
	return unlocalized === '/' || contentRoute.test(unlocalized) || namedRoute.test(unlocalized)
}

export function resolveNativeAppLink(value: string) {
	let url: URL
	try {
		url = new URL(value)
	} catch {
		return null
	}
	if (
		url.origin !== ANDROID_APP_LINK_ORIGIN ||
		url.username ||
		url.password ||
		!isNativeAppPath(url.pathname)
	) {
		return null
	}
	return `${url.pathname}${url.search}${url.hash}`
}

export function createNativeLinkHandler(
	navigate: (target: string) => void | Promise<void>,
	now: () => number = Date.now,
) {
	let previousTarget = ''
	let previousTime = 0

	return async (value: string) => {
		const target = resolveNativeAppLink(value)
		if (!target) return false
		const currentTime = now()
		if (target === previousTarget && currentTime - previousTime < 1_500) return false
		previousTarget = target
		previousTime = currentTime
		await navigate(target)
		return true
	}
}
