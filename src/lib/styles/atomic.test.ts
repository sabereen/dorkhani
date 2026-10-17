// @vitest-environment jsdom

import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createGenerator, presetWind3 } from 'unocss'
import { describe, expect, it, vi } from 'vitest'
import unoConfig from '../../../uno.config'
import { designSystem } from '../../../uno/design-system'

describe('atomic design system', () => {
	it('generates every shortcut without silently dropping unsupported utilities', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
		try {
			const uno = await createGenerator({ ...unoConfig, warn: true })
			const names = Object.keys(unoConfig.shortcuts ?? {})
			const { css, matched } = await uno.generate(names.join(' '))
			expect([...matched].sort()).toEqual(names.sort())
			expect(warn).not.toHaveBeenCalled()
			expect(css).not.toContain('@layer')
			expect(css).toContain('grid-gap:')
			// Safe-area insets are physical device geometry; all other spacing is logical.
			expect(css.replace(/\.app\{[^}]+\}/g, '')).not.toMatch(
				/(?:margin|padding)-(?:right|left)\s*:/,
			)
		} finally {
			warn.mockRestore()
		}
	})

	it('keeps variants after primitive defaults regardless of utility sort order', async () => {
		const ui = designSystem([
			[
				['ui-test-control', 'p-4 border-2'],
				['ui-test-small', 'p-2'],
				['ui-test-control', '[&[disabled]]:(p-0)'],
			],
		])
		const uno = await createGenerator({
			presets: [presetWind3()],
			shortcuts: ui.shortcuts,
			variants: [ui.variant],
			layers: ui.layers,
			outputToCssLayers: false,
		})
		const { css } = await uno.generate('ui-test-control ui-test-small')
		const fixture = document.createElement('div')
		fixture.innerHTML = `<style>${css}</style>
			<button class="ui-test-control ui-test-small"></button>
			<button class="ui-test-control ui-test-small" disabled></button>`
		document.body.append(fixture)
		try {
			const [small, disabled] = fixture.querySelectorAll('button')
			expect(getComputedStyle(small).padding).toBe('0.5rem')
			expect(getComputedStyle(disabled).padding).toBe('0px')
		} finally {
			fixture.remove()
		}
	})

	it('retains interleaved responsive overrides and allows local atomic adjustments', async () => {
		const ui = designSystem([
			[
				['ui-test-panel', 'p-4'],
				['ui-test-panel', '[@media(min-width:768px)]:(p-6)'],
				['ui-test-panel', 'p-2'],
			],
		])
		const uno = await createGenerator({
			presets: [presetWind3()],
			shortcuts: ui.shortcuts,
			variants: [ui.variant],
			layers: ui.layers,
			outputToCssLayers: false,
		})
		const { css } = await uno.generate('ui-test-panel p-0')
		expect(css.indexOf('padding:1rem')).toBeLessThan(css.indexOf('@media'))
		expect(css.indexOf('@media')).toBeLessThan(css.indexOf('padding:0.5rem'))
		expect(css.indexOf('padding:0.5rem')).toBeLessThan(css.indexOf('.p-0'))
	})

	it('keeps application components free of local styles and static inline CSS', () => {
		const files = readdirSync(resolve('src'), { recursive: true })
			.map(String)
			.filter((file) => file.endsWith('.svelte'))
		for (const file of files) {
			const source = readFileSync(resolve('src', file), 'utf8')
			expect(source, file).not.toMatch(/<style\b|\bstyle\s*=/)
		}
	})
})
