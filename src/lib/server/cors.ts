export function parseTrustedOrigins(value: string | undefined) {
	const origins = new Set<string>()
	for (const item of (value || '').split(',')) {
		const candidate = item.trim()
		if (!candidate) continue
		try {
			const url = new URL(candidate)
			if (url.protocol === 'https:' || url.protocol === 'http:') origins.add(url.origin)
		} catch {
			// Invalid allowlist entries are ignored.
		}
	}
	return origins
}

export function getAllowedCorsOrigin(requestOrigin: string | null, trustedOrigins: Set<string>) {
	if (!requestOrigin) return null
	try {
		const origin = new URL(requestOrigin).origin
		return trustedOrigins.has(origin) ? origin : null
	} catch {
		return null
	}
}

export function isSameOrigin(requestOrigin: string | null, requestUrl: URL) {
	if (!requestOrigin) return true
	try {
		return new URL(requestOrigin).origin === requestUrl.origin
	} catch {
		return false
	}
}

export function createCorsHeaders(origin: string) {
	return new Headers({
		'access-control-allow-origin': origin,
		'access-control-allow-credentials': 'true',
		'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'access-control-allow-headers': 'Authorization, Content-Type, X-App-Locale',
		'access-control-expose-headers': 'set-auth-token',
		vary: 'Origin',
	})
}
