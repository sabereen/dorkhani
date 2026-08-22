import { describe, expect, it, vi } from 'vitest'
import { createNativeLinkHandler, isNativeAppPath, resolveNativeAppLink } from './deep-links'

describe('Android App Link resolver', () => {
	it('keeps localized paths, query strings, and fragments', () => {
		expect(resolveNativeAppLink('https://dorkhani.ir/ar/ks12/grid?t=secret#part')).toBe(
			'/ar/ks12/grid?t=secret#part',
		)
	})

	it('accepts user-facing app routes', () => {
		expect(isNativeAppPath('/')).toBe(true)
		expect(isNativeAppPath('/en/auth/reset-password')).toBe(true)
		expect(isNativeAppPath('/account/khatms/12/edit')).toBe(true)
		expect(isNativeAppPath('/z42')).toBe(true)
	})

	it('rejects foreign origins and server-only routes', () => {
		expect(resolveNativeAppLink('https://example.com/k12')).toBeNull()
		expect(resolveNativeAppLink('http://dorkhani.ir/k12')).toBeNull()
		expect(resolveNativeAppLink('https://user@dorkhani.ir/k12')).toBeNull()
		expect(resolveNativeAppLink('https://dorkhani.ir/api/khatm/page')).toBeNull()
		expect(resolveNativeAppLink('https://dorkhani.ir/admin')).toBeNull()
	})

	it('deduplicates launch and appUrlOpen events for the same URL', async () => {
		const navigate = vi.fn()
		const now = vi.fn().mockReturnValueOnce(1_000).mockReturnValueOnce(1_100)
		const handle = createNativeLinkHandler(navigate, now)

		await expect(handle('https://dorkhani.ir/k12?t=token')).resolves.toBe(true)
		await expect(handle('https://dorkhani.ir/k12?t=token')).resolves.toBe(false)
		expect(navigate).toHaveBeenCalledOnce()
	})
})
