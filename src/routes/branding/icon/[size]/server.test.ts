import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }))

vi.mock('$lib/server/db', () => ({
	db: { tAppSettings: { findUnique: mocks.findUnique } },
}))
vi.mock('$service/appSettings', () => ({
	appSettings_store: { config: { branding: { revision: 'revision-1' } } },
}))

import { GET } from './+server'

describe('branding icon endpoint', () => {
	beforeEach(() => vi.resetAllMocks())

	it('serves a configured PNG icon', async () => {
		mocks.findUnique.mockResolvedValue({ appIcon192: new Uint8Array([1, 2, 3]) })
		const response = await GET({
			params: { size: '192' },
			request: new Request('http://localhost/branding/icon/192?v=1'),
		} as never)

		expect(response.status).toBe(200)
		expect(response.headers.get('content-type')).toBe('image/png')
	})

	it('rejects unsupported icon sizes without querying the database', async () => {
		const response = await GET({
			params: { size: '256' },
			request: new Request('http://localhost/branding/icon/256'),
		} as never)

		expect(response.status).toBe(404)
		expect(mocks.findUnique).not.toHaveBeenCalled()
	})
})
