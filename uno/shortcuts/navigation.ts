import type { UiShortcut } from '../types'

export default [
	[
		'ui-header',
		'mb-4 relative z-[100] min-w-0 [border:1px_solid_var(--ui-color-border)] rounded-[1rem] surface-surface-raised shadow-ui-sm',
	],
	['ui-header-inner', 'min-w-0 min-h-[3.375rem] p-[0.3125rem] ui-row'],
	['ui-header-context', 'min-w-0 [flex:1_1_0%] text-ui-text no-underline ui-row'],
	['ui-header-brand', 'min-w-0 [flex:1_1_0%] text-ui-text no-underline ui-row'],
	['ui-header-context', '[&>*+*]:(ms-2)'],
	['ui-header-brand', '[&>*+*]:(ms-2)'],
	['ui-header-brand', 'ps-1'],
	[
		'ui-header-brand-mark',
		'w-9 h-9 [flex:0_0_auto] overflow-hidden rounded-[0.75rem] surface-primary-soft',
	],
	['ui-header-brand', '[&_img]:(block w-full h-full object-cover)'],
	[
		'ui-header-title',
		'min-w-0 mt-0 mb-0 overflow-hidden text-[0.9rem] font-850 leading-[1.6] text-ellipsis whitespace-nowrap',
	],
	[
		'ui-header-brand',
		'[&_strong]:(min-w-0 mt-0 mb-0 overflow-hidden text-[0.9rem] font-850 leading-[1.6] text-ellipsis whitespace-nowrap)',
	],
	['ui-header-title', '[&_a]:([color:inherit] no-underline)'],
	['ui-header-controls', '[flex:0_0_auto] ui-row'],
	['ui-header-actions', '[flex:0_0_auto] ui-row'],
	['ui-header-controls', 'ms-[0.375rem]'],
	['ui-header-controls', '[&>*+*]:(ms-1)'],
	['ui-header-actions', '[&>*+*]:(ms-1)'],
	['ui-header-actions', '[&:empty]:(hidden)'],
	[
		'ui-header-back',
		'w-11 h-11 [flex:0_0_auto] p-0 [border:1px_solid_transparent] rounded-[0.75rem] [background:transparent] text-ui-text [font:inherit] text-[0.78rem] font-750 no-underline cursor-pointer [transition:background-color_160ms_ease,_border-color_160ms_ease,_color_160ms_ease] ui-inline-center',
	],
	[
		'ui-header-menu-button',
		'w-11 h-11 [flex:0_0_auto] p-0 [border:1px_solid_transparent] rounded-[0.75rem] [background:transparent] text-ui-text [font:inherit] text-[0.78rem] font-750 no-underline cursor-pointer [transition:background-color_160ms_ease,_border-color_160ms_ease,_color_160ms_ease] ui-inline-center',
	],
	[
		'ui-header-page-action',
		'w-11 h-11 [flex:0_0_auto] p-0 [border:1px_solid_transparent] rounded-[0.75rem] [background:transparent] text-ui-text [font:inherit] text-[0.78rem] font-750 no-underline cursor-pointer [transition:background-color_160ms_ease,_border-color_160ms_ease,_color_160ms_ease] ui-inline-center',
	],
	['ui-header-page-action', 'border-ui-border surface-surface-muted'],
	['ui-header-menu-button', 'border-ui-border surface-surface-muted'],
	['ui-header-back', '[&:hover]:(border-ui-primary surface-primary-soft text-ui-primary)'],
	['ui-header-menu-button', '[&:hover]:(border-ui-primary surface-primary-soft text-ui-primary)'],
	['ui-header-page-action', '[&:hover]:(border-ui-primary surface-primary-soft text-ui-primary)'],
	[
		'ui-header-menu-button',
		"[&[aria-expanded='true']]:(border-ui-primary surface-primary-soft text-ui-primary)",
	],
	['ui-header', '[&_svg]:(w-5 h-5 [flex:0_0_auto])'],
	['ui-header-page-action', '[&>span]:(hidden)'],
	['ui-header-page-action', '[&>.ui-spinner]:(inline-block [flex:0_0_auto])'],
	['ui-header-page-action-primary', 'border-ui-primary surface-primary text-ui-on-primary'],
	[
		'ui-header-page-action-primary',
		'[&:hover]:(border-ui-primary-hover surface-primary-hover text-ui-on-primary)',
	],
	['ui-header-page-action', '[&:disabled]:(opacity-[0.55] cursor-wait pointer-events-none)'],
	[
		'ui-header-brand',
		'[&:focus]:([outline:2px_solid_var(--ui-color-primary)] [outline-offset:2px])',
	],
	[
		'ui-header-title',
		'[&_a:focus]:([outline:2px_solid_var(--ui-color-primary)] [outline-offset:2px])',
	],
	[
		'ui-header-back',
		'[&:focus]:([outline:2px_solid_var(--ui-color-primary)] [outline-offset:2px])',
	],
	[
		'ui-header-menu-button',
		'[&:focus]:([outline:2px_solid_var(--ui-color-primary)] [outline-offset:2px])',
	],
	[
		'ui-header-page-action',
		'[&:focus]:([outline:2px_solid_var(--ui-color-primary)] [outline-offset:2px])',
	],
	['ui-nav-link', '[&:focus]:([outline:2px_solid_var(--ui-color-primary)] [outline-offset:2px])'],
	['ui-header', '[&+.ui-page]:(pt-0)'],
	['ui-header', '[&+.ui-khatm-page]:(pt-0)'],
	['ui-header-menu-modal', 'max-w-120 p-4 rounded-[1.5rem]'],
	['ui-header-menu-modal', '[&_svg]:(w-5 h-5 [flex:0_0_auto])'],
	['ui-header-menu-heading', 'mb-4 ui-row'],
	[
		'ui-header-menu-brand',
		'w-12 h-12 [flex:0_0_auto] overflow-hidden [border:1px_solid_var(--ui-color-border)] rounded-[1rem] surface-primary-soft',
	],
	['ui-header-menu-brand', '[&_img]:(block w-full h-full object-cover)'],
	['ui-header-menu-copy', 'min-w-0 [flex:1_1_auto] ms-3'],
	[
		'ui-header-menu-copy',
		'[&_h2]:(m-0 text-ui-text text-[1.05rem] font-850 [overflow-wrap:break-word])',
	],
	[
		'ui-header-menu-copy',
		'[&_p]:(mt-[0.2rem] ms-0 me-0 mb-0 text-ui-text-muted text-[0.75rem] [overflow-wrap:break-word])',
	],
	['ui-header-menu-close', 'w-11 h-11 [flex:0_0_auto] ms-2'],
	[
		'ui-header-menu-context',
		'mb-4 p-3 [border:1px_solid_var(--ui-color-border)] rounded-[1rem] surface-surface-inset',
	],
	[
		'ui-header-menu-context',
		'[&_h3]:(mt-0 ms-0 me-0 mb-2 text-ui-text-muted text-[0.8rem] font-700 [overflow-wrap:break-word] [word-break:break-word])',
	],
	['ui-header-menu-grid', 'grid grid-cols-2 gap-[0.625rem]'],
	[
		'ui-header-menu-tile',
		'min-w-0 min-h-23 items-start justify-center p-3 [border:1px_solid_var(--ui-color-border)] rounded-[1rem] surface-surface-muted text-ui-text text-[0.85rem] font-750 no-underline [transition:background-color_160ms_ease,_border-color_160ms_ease] ui-stack',
	],
	[
		'ui-header-menu-tile',
		'[&>span:last-child]:(max-w-full mt-2 [overflow-wrap:break-word] [word-break:break-word])',
	],
	[
		'ui-header-menu-icon',
		'w-9 h-9 [flex:0_0_auto] rounded-[0.75rem] surface-primary-soft text-ui-primary ui-inline-center',
	],
	['ui-header-menu-tile', '[&:hover]:(border-ui-primary surface-primary-soft)'],
	['ui-header-menu-account', '[&:hover]:(border-ui-primary surface-primary-soft)'],
	['ui-header-menu-tile-active', 'border-ui-primary surface-primary-soft text-ui-primary'],
	['ui-header-menu-tile-active', '[&_.ui-header-menu-icon]:(surface-primary text-ui-on-primary)'],
	[
		'ui-header-menu-tile',
		'[&:focus]:([outline:2px_solid_var(--ui-color-primary)] [outline-offset:2px])',
	],
	[
		'ui-header-menu-account',
		'[&:focus]:([outline:2px_solid_var(--ui-color-primary)] [outline-offset:2px])',
	],
	['ui-header-menu-footer', 'mt-4 pt-4 [border-top:1px_solid_var(--ui-color-border)]'],
	[
		'ui-header-menu-account',
		'min-w-0 p-3 [border:1px_solid_var(--ui-color-border)] rounded-[1rem] surface-surface-muted text-ui-text no-underline ui-row',
	],
	[
		'ui-header-menu-account',
		'[&>span+span]:(min-w-0 ms-3 [overflow-wrap:break-word] [word-break:break-word] ui-stack)',
	],
	['ui-header-menu-account', '[&_small]:(text-ui-text-muted text-[0.7rem])'],
	['ui-header-menu-account', '[&_strong]:(text-[0.85rem] font-750)'],
	['ui-header-menu-preferences', 'grid grid-cols-2 gap-1 mt-2'],
	[
		'ui-nav-link',
		'w-full min-w-0 min-h-11 h-auto justify-start py-[0.625rem] ps-2 pe-2 [border:1px_solid_transparent] rounded-[0.75rem] [background:transparent] text-ui-text [font:inherit] text-[0.8rem] font-700 text-start no-underline cursor-pointer ui-row',
	],
	[
		'ui-header-menu-actions',
		'[&_.ui-header-page-action]:(w-full min-w-0 min-h-11 h-auto justify-start py-[0.625rem] ps-2 pe-2 [border:1px_solid_transparent] rounded-[0.75rem] [background:transparent] text-ui-text [font:inherit] text-[0.8rem] font-700 text-start no-underline cursor-pointer ui-row)',
	],
	[
		'ui-nav-link',
		'[&>span]:(block min-w-0 ms-2 [overflow-wrap:break-word] [word-break:break-word])',
	],
	[
		'ui-header-menu-actions',
		'[&_.ui-header-page-action>span]:(block min-w-0 ms-2 [overflow-wrap:break-word] [word-break:break-word])',
	],
	['ui-nav-link', '[&_svg]:(text-ui-primary)'],
	['ui-header-menu-actions', '[&_svg]:(text-ui-primary)'],
	['ui-nav-link', '[&:hover]:(surface-primary-soft text-ui-primary)'],
	[
		'ui-header-menu-actions',
		'[&_.ui-header-page-action:hover]:(surface-primary-soft text-ui-primary)',
	],
	['ui-header-back', "[html[dir='ltr']_&_svg]:([transform:rotate(180deg)])"],
	['ui-header-wide', '[&_.ui-header-controls_.ui-header-page-action]:(w-auto ps-3 pe-3)'],
	[
		'ui-header-wide',
		'[&_.ui-header-controls_.ui-header-page-action>span]:(block max-w-28 overflow-hidden text-ellipsis whitespace-nowrap)',
	],
	['ui-header-wide', '[&_.ui-header-controls_.ui-header-page-action>*+*]:(ms-[0.375rem])'],
	['ui-card-body', '[@media(min-width:768px)]:(p-6)'],
	['ui-header', '[@media(min-width:1100px)]:(sticky top-4)'],
	['ui-alert', '[@media(max-width:767px)]:(items-start flex-col)'],
	['ui-alert', '[@media(max-width:767px)]:[&>*+*]:(mt-3 ms-0)'],
] satisfies UiShortcut[]
