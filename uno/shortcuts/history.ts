import type { UiShortcut } from '../types'

export default [
	['ui-history-page', '[&&]:(pt-6)'],
	[
		'ui-history-intro',
		'[&&]:(p-6 [border:1px_solid_var(--ui-color-border)] rounded-[1.5rem] [background:linear-gradient(135deg,_var(--ui-color-primary-soft),_var(--ui-color-surface))] ui-row)',
	],
	['ui-history-intro', '[&&>*+*]:(ms-4)'],
	[
		'ui-history-intro-icon',
		'[&&]:(w-14 h-14 [flex:0_0_3.5rem] rounded-[1rem] surface-primary text-ui-on-primary center)',
	],
	['ui-history-intro-icon', '[&&_svg]:(w-7 h-7)'],
	['ui-history-intro', '[&&_h2]:(m-0)'],
	['ui-history-intro', '[&&_p]:(m-0)'],
	['ui-history-intro', '[&&_h2]:(text-[1.2rem] font-900)'],
	['ui-history-intro', '[&&_p]:(mt-[0.3rem] text-ui-text-muted text-[0.85rem] leading-[1.8])'],
	['ui-history-grid', '[&&]:(grid grid-cols-3 gap-4 [align-items:start] mt-4)'],
	[
		'ui-history-empty',
		'[&&]:(py-8 ps-4 pe-4 [border:1px_dashed_var(--ui-color-border-strong)] rounded-[1.25rem] surface-surface-muted text-ui-text-muted text-center)',
	],
	['ui-history-grid', '[@media(max-width:1023px)]:[&&]:(grid-cols-2)'],
	['ui-history-grid', '[@media(max-width:767px)]:[&&]:(grid-cols-[minmax(0,_1fr)])'],
	['ui-history-intro', '[@media(max-width:767px)]:[&&]:(items-start p-5)'],
] satisfies UiShortcut[]
