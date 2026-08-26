export type MiniAppHostName = 'bale' | 'eitaa'

const khatmTargetPattern = /^\/(?:a|k)s?\d+(?:\?t=[A-Za-z0-9_-]+)?$/

function toBase64(value: string) {
	const bytes = new TextEncoder().encode(value)
	let binary = ''
	for (const byte of bytes) binary += String.fromCharCode(byte)
	return btoa(binary)
}

function fromBase64(value: string) {
	const binary = atob(value)
	const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
	return new TextDecoder().decode(bytes)
}

export function normalizeMiniAppBaseUrl(value: string | undefined | null) {
	if (!value) return null
	try {
		const url = new URL(value)
		if (url.protocol !== 'https:') return null
		url.hash = ''
		url.searchParams.delete('startapp')
		return url.href
	} catch {
		return null
	}
}

export function encodeMiniAppTarget(path: string) {
	if (!khatmTargetPattern.test(path)) return null
	return toBase64(path).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeMiniAppTarget(payload: string | undefined | null) {
	if (!payload || !/^[A-Za-z0-9_-]+$/.test(payload)) return null
	try {
		const padded = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(
			Math.ceil(payload.length / 4) * 4,
			'=',
		)
		const path = fromBase64(padded)
		return khatmTargetPattern.test(path) ? path : null
	} catch {
		return null
	}
}

export function createMiniAppLink(baseUrl: string | undefined | null, khatmPath: string) {
	const normalizedBaseUrl = normalizeMiniAppBaseUrl(baseUrl)
	const payload = encodeMiniAppTarget(khatmPath)
	if (!normalizedBaseUrl || !payload) return null
	const url = new URL(normalizedBaseUrl)
	url.searchParams.set('startapp', payload)
	return url.href
}
