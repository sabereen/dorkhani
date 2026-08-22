import { describe, expect, it } from 'vitest'
import { khatmShortcutIdFromRoute } from './khatm-shortcuts'

describe('khatm shortcut identity', () => {
	it('creates stable IDs for regular and serial khatms', () => {
		expect(khatmShortcutIdFromRoute('k12')).toBe('khatm:k12')
		expect(khatmShortcutIdFromRoute('as34')).toBe('khatm:as34')
	})

	it('rejects non-khatm routes', () => {
		expect(() => khatmShortcutIdFromRoute('admin')).toThrow()
	})
})
