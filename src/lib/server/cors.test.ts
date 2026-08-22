import { describe, expect, it } from 'vitest'
import {
	createCorsHeaders,
	getAllowedCorsOrigin,
	isSameOrigin,
	parseTrustedOrigins,
} from './cors'

describe('native CORS policy', () => {
	const trusted = parseTrustedOrigins('https://localhost, https://native.example.test/')

	it('accepts only exact allowlisted origins', () => {
		expect(getAllowedCorsOrigin('https://localhost', trusted)).toBe('https://localhost')
		expect(getAllowedCorsOrigin('https://evil.example.test', trusted)).toBeNull()
		expect(getAllowedCorsOrigin('https://localhost.evil.example.test', trusted)).toBeNull()
		expect(isSameOrigin('https://api.example.test', new URL('https://api.example.test/api'))).toBe(
			true,
		)
		expect(isSameOrigin('https://evil.example.test', new URL('https://api.example.test/api'))).toBe(
			false,
		)
	})

	it('exposes the bearer response header', () => {
		const headers = createCorsHeaders('https://localhost')
		expect(headers.get('access-control-allow-origin')).toBe('https://localhost')
		expect(headers.get('access-control-allow-headers')).toContain('Authorization')
		expect(headers.get('access-control-expose-headers')).toBe('set-auth-token')
	})
})
