import { describe, expect, it } from 'vitest'
import {
	createMiniAppLink,
	decodeMiniAppTarget,
	encodeMiniAppTarget,
	normalizeMiniAppBaseUrl,
} from './links'

describe('Mini App links', () => {
	it('round-trips public and private khatm paths', () => {
		for (const path of ['/k12', '/as34?t=private-token_1']) {
			const payload = encodeMiniAppTarget(path)
			expect(payload).toMatch(/^[A-Za-z0-9_-]+$/)
			expect(decodeMiniAppTarget(payload)).toBe(path)
		}
	})

	it('rejects non-khatm targets and unsafe base URLs', () => {
		expect(encodeMiniAppTarget('/account')).toBeNull()
		expect(decodeMiniAppTarget('not-a-valid-target')).toBeNull()
		expect(normalizeMiniAppBaseUrl('http://example.com/app')).toBeNull()
	})

	it('adds a startapp payload while preserving configured query parameters', () => {
		const result = createMiniAppLink('https://ble.ir/example?mode=app', '/ks42?t=token')
		const url = new URL(result!)
		expect(url.searchParams.get('mode')).toBe('app')
		expect(decodeMiniAppTarget(url.searchParams.get('startapp'))).toBe('/ks42?t=token')
	})
})
