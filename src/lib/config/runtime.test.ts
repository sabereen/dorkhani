import { describe, expect, it } from 'vitest'
import { resolveServerUrl } from './runtime'

describe('runtime URL resolver', () => {
	it('keeps web API requests on the current origin and base path', () => {
		expect(
			resolveServerUrl('/api/home', {
				target: 'web',
				currentOrigin: 'https://example.test',
				basePath: '/app',
			}),
		).toBe('https://example.test/app/api/home')
	})

	it('uses the configured backend for capacitor requests', () => {
		expect(
			resolveServerUrl('/api/home', {
				target: 'capacitor',
				serverOrigin: 'https://api.example.test',
			}),
		).toBe('https://api.example.test/api/home')
	})

	it('does not duplicate an existing base path', () => {
		expect(
			resolveServerUrl('/app/api/home', {
				target: 'web',
				currentOrigin: 'https://example.test',
				basePath: '/app',
			}),
		).toBe('https://example.test/app/api/home')
	})
})
