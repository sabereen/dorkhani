import { readFileSync, readdirSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { createGenerator } from 'unocss'
import { describe, expect, it } from 'vitest'
import unoConfig from '../../../uno.config'

describe('logical CSS contract', () => {
	it('generates logical UnoCSS spacing utilities', async () => {
		const uno = await createGenerator(unoConfig)
		const { css } = await uno.generate('ms-2 me-3 ps-4 pe-5 text-start')
		expect(css).toContain('margin-inline-start')
		expect(css).toContain('margin-inline-end')
		expect(css).toContain('padding-inline-start')
		expect(css).toContain('padding-inline-end')
		expect(css).toContain('text-align:start')
	})

	it('does not keep physical directional margin or padding in application styles', () => {
		const sourceRoot = resolve('src')
		const files = readdirSync(sourceRoot, { recursive: true })
			.map(String)
			.filter((file) => ['.css', '.svelte'].includes(extname(file)))
		const source = files
			.map((file) => readFileSync(resolve(sourceRoot, file), 'utf8'))
			.join('\n')
		expect(source).not.toMatch(/(?:margin|padding)-(?:right|left)\s*:/)
	})
})
