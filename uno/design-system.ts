import { expandVariantGroup, type Variant } from 'unocss'
import type { UiShortcut } from './types'

/**
 * Keep the design system's authored cascade, including interleaved media queries.
 * Uno normally sorts shortcuts by their underlying utility, which can put a base
 * control after its variant. Internal layers preserve order without emitting CSS
 * @layer (unsupported by Chrome 64). Ordinary utilities remain the final layer.
 */
export function designSystem(groups: UiShortcut[][]) {
	const entries = groups.flat()
	const shortcuts: Record<string, string> = {}
	const layers: Record<string, number> = {
		imports: -entries.length - 100,
		preflights: -entries.length - 99,
	}
	for (const [index, [name, utilities]] of entries.entries()) {
		const layer = `ui-${index}`
		layers[layer] = index - entries.length - 10
		const body = expandVariantGroup(utilities)
			.split(/\s+/)
			.map((utility) => `${layer}:${utility}`)
			.join(' ')
		shortcuts[name] = [shortcuts[name], body].filter(Boolean).join(' ')
	}
	const variant: Variant = {
		name: 'ui-cascade',
		match(matcher) {
			const match = /^(ui-\d+):/.exec(matcher)
			if (!match) return
			return { matcher: matcher.slice(match[0].length), layer: match[1] }
		},
	}
	return { shortcuts, layers, variant }
}
