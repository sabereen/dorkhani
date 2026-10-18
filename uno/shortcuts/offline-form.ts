import type { UiShortcut } from '../types'

export default [
	['ui-offline-form', '[&&]:(surface-surface-raised)'],
	['ui-offline-form-heading', '[&&]:(ui-row)'],
	['ui-offline-series', '[&&]:(ui-row)'],
	['ui-offline-form-actions', '[&&]:(ui-row)'],
	['ui-offline-form-heading', '[&&>*+*]:(ms-3)'],
	['ui-offline-series', '[&&>*+*]:(ms-3)'],
	['ui-offline-form-actions', '[&&>*+*]:(ms-3)'],
	['ui-offline-form-heading', '[&&_h2]:(m-0)'],
	['ui-offline-form-heading', '[&&_p]:(m-0)'],
	['ui-offline-form-heading', '[&&_p]:(mt-[0.2rem] text-ui-text-muted text-[0.8rem])'],
	[
		'ui-offline-form-icon',
		'[&&]:(w-12 h-12 [flex:0_0_3rem] rounded-[1rem] surface-primary-soft text-ui-primary text-[1.5rem] center)',
	],
	['ui-offline-fields', '[&&]:(ui-grid gap-[0.4rem])'],
	['ui-offline-fields', '[&&]:(mt-4)'],
	['ui-offline-form', '[&&_.ui-fieldset]:(mt-4)'],
	['ui-offline-series', '[&&]:(mt-4)'],
	['ui-offline-form-actions', '[&&]:(mt-4)'],
	[
		'ui-offline-series',
		'[&&]:(p-[0.85rem] [border:1px_solid_var(--ui-color-control-border)] rounded-ui-md surface-control-surface cursor-pointer)',
	],
	['ui-offline-series', "[&&[data-selected='true']]:(border-ui-primary surface-primary-softer)"],
	['ui-offline-series', '[&&_span]:(block)'],
	['ui-offline-series', '[&&_small]:(block)'],
	['ui-offline-series', '[&&_small]:(mt-[0.15rem] text-ui-text-muted)'],
	['ui-offline-form-actions', '[&&]:(justify-end)'],
] satisfies UiShortcut[]
