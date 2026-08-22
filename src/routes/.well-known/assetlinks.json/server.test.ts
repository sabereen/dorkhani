import { beforeEach, describe, expect, it, vi } from 'vitest'

const privateEnv = vi.hoisted(() => ({ ANDROID_SHA256_CERT_FINGERPRINTS: '' }))
vi.mock('$env/dynamic/private', () => ({ env: privateEnv }))

import { GET } from './+server'

const fingerprint = Array.from({ length: 32 }, (_, index) =>
	index.toString(16).padStart(2, '0'),
).join(':')

describe('assetlinks.json endpoint', () => {
	beforeEach(() => {
		privateEnv.ANDROID_SHA256_CERT_FINGERPRINTS = ''
	})

	it('returns 503 until signing certificates are configured', async () => {
		const response = await GET({} as never)
		expect(response.status).toBe(503)
	})

	it('returns 503 for a malformed signing certificate fingerprint', async () => {
		privateEnv.ANDROID_SHA256_CERT_FINGERPRINTS = 'invalid'
		const response = await GET({} as never)
		expect(response.status).toBe(503)
	})

	it('returns the Android association without a redirect', async () => {
		privateEnv.ANDROID_SHA256_CERT_FINGERPRINTS = fingerprint
		const response = await GET({} as never)
		expect(response.status).toBe(200)
		expect(response.headers.get('content-type')).toContain('application/json')
		expect(response.headers.get('location')).toBeNull()
		expect(await response.json()).toEqual([
			expect.objectContaining({
				target: expect.objectContaining({ package_name: 'ir.dorkhani.app' }),
			}),
		])
	})
})
