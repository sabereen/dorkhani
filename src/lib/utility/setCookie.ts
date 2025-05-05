export function setCookie(key: string, value: string, maxAge = 30 * 24 * 3600) {
	document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; max-age=${maxAge}`
}
