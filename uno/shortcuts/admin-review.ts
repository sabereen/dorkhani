import type { UiShortcut } from '../types'

export default [
	[
		'ui-admin-featured-panel',
		'[&&]:(mt-4 border-ui-border-strong [background:linear-gradient(_145deg,_var(--ui-color-warning-soft),_var(--ui-color-surface)_18rem_)])',
	],
	['ui-admin-featured-heading', '[&&]:(flex items-start justify-between min-w-0 flex-wrap)'],
	['ui-admin-featured-heading', '[&&>div]:(min-w-0 [flex:1_1_14rem])'],
	['ui-admin-featured-heading', '[&&>.ui-badge]:([flex:0_0_auto] mt-1)'],
	['ui-admin-featured-heading', '[&&>*+*]:(ms-4)'],
	['ui-admin-featured-kicker', '[&&]:(text-ui-warning text-[0.76rem] font-900 ui-row)'],
	['ui-admin-featured-kicker', '[&&_svg]:(w-4 h-4 me-[0.35rem])'],
	['ui-admin-featured-heading', '[&&_h2]:(mt-[0.35rem])'],
	['ui-admin-featured-heading', '[&&_p]:(text-ui-text-muted text-[0.82rem])'],
	['ui-admin-featured-message', '[&&]:(text-ui-text-muted text-[0.82rem])'],
	['ui-admin-featured-heading', '[&&_p]:(mt-[0.3rem] ms-0 me-0 mb-0)'],
	['ui-admin-featured-list', '[&&]:(mt-4)'],
	['ui-admin-featured-loading', '[&&]:(min-h-16 text-ui-text-muted ui-row)'],
	['ui-admin-featured-loading', '[&&>*+*]:(ms-2)'],
	['ui-admin-featured-message', '[&&]:(min-h-5 mt-3 ms-0 me-0 mb-0)'],
] satisfies UiShortcut[]
