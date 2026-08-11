import { describe, expect, it } from 'vitest'
import { colorSchemes, isManualColorScheme } from './Theme'
import { normalizeSettings } from './LocalSettings.svelte'

describe('color scheme', () => {
	it('offers system, light and dark schemes', () => {
		expect(colorSchemes.map(({ slug }) => slug)).toEqual(['system', 'light', 'dark'])
	})

	it('only accepts explicit schemes for SSR attributes', () => {
		expect(isManualColorScheme('light')).toBe(true)
		expect(isManualColorScheme('dark')).toBe(true)
		expect(isManualColorScheme('system')).toBe(false)
		expect(isManualColorScheme('forest')).toBe(false)
	})

	it('ignores obsolete themes while preserving valid settings', () => {
		expect(
			normalizeSettings({
				['dai' + 'syTheme']: 'forest',
				translation: 'makarem',
				pageBasedProgress: true,
			}),
		).toEqual({
			translation: 'makarem',
		})
	})

	it('discards invalid persisted values', () => {
		expect(normalizeSettings({ colorScheme: 'forest', quranFont: 'invalid' })).toEqual({})
	})
})
