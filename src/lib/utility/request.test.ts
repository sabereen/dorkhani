import { describe, expect, it, vi } from 'vitest'
import { apiRequest } from './request'

describe('ApiClient retries', () => {
	it('retries a transient GET failure once', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockRejectedValueOnce(new TypeError('network'))
			.mockResolvedValueOnce(Response.json({ ok: true }))

		await expect(
			apiRequest<{ ok: boolean }>('GET', '/home', {
				fetch: fetcher,
				origin: 'https://example.test',
			}),
		).resolves.toEqual({ ok: true })
		expect(fetcher).toHaveBeenCalledTimes(2)
	})

	it('does not retry mutations by default', async () => {
		const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('network'))
		await expect(
			apiRequest('POST', '/khatm/create', {
				fetch: fetcher,
				origin: 'https://example.test',
				body: {},
			}),
		).rejects.toThrow('network')
		expect(fetcher).toHaveBeenCalledOnce()
	})

	it('clears an expired bearer token after a 401 response', async () => {
		const tokenStore = {
			get: vi.fn(() => 'expired-token'),
			set: vi.fn(),
			clear: vi.fn(),
		}
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
			Response.json({ message: 'Unauthorized' }, { status: 401 }),
		)

		await expect(
			apiRequest('GET', '/account', {
				fetch: fetcher,
				origin: 'https://example.test',
				tokenStore,
				retry: 0,
			}),
		).rejects.toMatchObject({ status: 401 })
		expect(tokenStore.clear).toHaveBeenCalledOnce()
	})
})
