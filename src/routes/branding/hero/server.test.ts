import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }))

vi.mock('$lib/server/db', () => ({
	db: { tAppSettings: { findUnique: mocks.findUnique } },
}))
vi.mock('$service/appSettings', () => ({
	appSettings_store: { config: { branding: { revision: 'revision-1' } } },
}))

import { GET } from './+server'

describe('branding hero endpoint', () => {
	beforeEach(() => vi.resetAllMocks())

	it('returns the configured image with immutable caching', async () => {
		mocks.findUnique.mockResolvedValue({
			heroImage: new Uint8Array([1, 2, 3]),
			heroImageMime: 'image/png',
		})
		const response = await GET({ request: new Request('http://localhost/branding/hero?v=1') } as never)

		expect(response.status).toBe(200)
		expect(response.headers.get('content-type')).toBe('image/png')
		expect(response.headers.get('cache-control')).toContain('immutable')
	})

	it('redirects to the bundled default when no custom image exists', async () => {
		mocks.findUnique.mockResolvedValue(null)
		const response = await GET({ request: new Request('http://localhost/branding/hero') } as never)

		expect(response.status).toBe(307)
		expect(response.headers.get('location')).toBe('/hero.png')
	})
})
