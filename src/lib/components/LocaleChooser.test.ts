import { describe, expect, it } from 'vitest'
import { render } from 'svelte/server'
import LocaleChooser from './LocaleChooser.svelte'

describe('LocaleChooser SSR', () => {
	it('does not render dialog markup before hydration', () => {
		const { body } = render(LocaleChooser, { props: { unresolved: true } })
		expect(body).not.toContain('role="dialog"')
	})
})
