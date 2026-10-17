import type { UiShortcut } from '../types'

export default [
	['ui-khatm-share-dialog', 'max-w-248 p-5'],
	['ui-share-close', '[&&]:(absolute top-3 left-3)'],
	['ui-share-close', "[html[dir='ltr']_&&]:(left-auto right-3)"],
	['ui-share-heading', '[&&]:(mb-4 pe-11 ui-row)'],
	['ui-share-heading', '[&&>*+*]:(ms-[0.8rem])'],
	[
		'ui-share-heading-icon',
		'[&&]:(w-12 h-12 [flex:0_0_3rem] rounded-[1rem] surface-primary-soft text-ui-primary text-[1.45rem] center)',
	],
	['ui-share-heading', '[&&_h2]:(m-0)'],
	['ui-share-heading', '[&&_p]:(m-0)'],
	['ui-share-preview-placeholder', '[&&_p]:(m-0)'],
	['ui-share-heading', '[&&_h2]:(text-[1.15rem] font-900)'],
	['ui-share-heading', '[&&_p]:(mt-[0.15rem] text-ui-text-muted text-[0.76rem] leading-[1.7])'],
	[
		'ui-share-layout',
		'[&&]:(grid grid-cols-[minmax(0,_1.45fr)_minmax(18rem,_0.8fr)] gap-4 [align-items:start])',
	],
	[
		'ui-share-preview',
		'[&&]:(min-w-0 [border:1px_solid_var(--ui-color-border)] rounded-ui-lg surface-surface-inset shadow-ui-md overflow-hidden)',
	],
	['ui-share-preview', '[&&_img]:(block w-full h-auto)'],
	['ui-share-preview-placeholder', '[&&]:(relative pt-[56.25%])'],
	[
		'ui-share-preview-placeholder',
		'[&&>div]:(absolute top-[50%] left-4 right-4 text-ui-text-muted text-center [transform:translateY(-50%)])',
	],
	['ui-share-preview-placeholder', '[&&_p]:(mt-[0.55rem] mb-[0.65rem] text-[0.78rem])'],
	[
		'ui-share-controls',
		'[&&]:(p-[0.85rem] [border:1px_solid_var(--ui-color-border)] rounded-ui-lg surface-surface-muted)',
	],
	['ui-share-primary-actions', '[&&]:(grid grid-cols-2 gap-[0.55rem])'],
	['ui-share-action-main', '[&&]:(col-span-full)'],
	['ui-share-links', '[&&]:(mt-[0.8rem] pt-3 [border-top:1px_solid_var(--ui-color-border)])'],
	[
		'ui-share-links-title',
		'[&&]:(mt-0 ms-0 me-0 mb-[0.45rem] text-ui-text-muted text-[0.68rem] font-800)',
	],
	[
		'ui-share-link-row',
		'[&&]:(grid grid-cols-[auto_minmax(0,_1fr)_auto] gap-[0.65rem] items-center p-[0.65rem] [border:1px_solid_var(--ui-color-border)] rounded-ui-md surface-surface-muted)',
	],
	['ui-share-link-row', '[&&+.ui-share-link-row]:(mt-2)'],
	[
		'ui-share-link-row-direct',
		'[&&]:([border-inline-start:0.2rem_solid_var(--ui-color-primary)] surface-primary-softer)',
	],
	['ui-share-link-icon', '[&&]:(w-9 h-9 rounded-full surface-primary-soft text-ui-primary center)'],
	['ui-share-link-copy', '[&&]:(min-w-0)'],
	['ui-share-link-copy', '[&&_strong]:(block)'],
	['ui-share-link-copy', '[&&_a]:(block)'],
	['ui-share-link-copy', '[&&_strong]:(text-[0.76rem])'],
	[
		'ui-share-link-copy',
		'[&&_a]:(mt-[0.1rem] text-ui-primary text-[0.68rem] leading-[1.6] break-all)',
	],
	['ui-share-layout', '[@media(max-width:700px)]:[&&]:(grid-cols-[minmax(0,_1fr)])'],
	['ui-share-controls', '[@media(max-width:700px)]:[&&]:(p-[0.85rem])'],
	['ui-khatm-share-dialog', '[@media(max-width:520px)]:(p-[0.9rem])'],
	[
		'ui-share-heading-icon',
		'[@media(max-width:520px)]:[&&]:(w-[2.6rem] h-[2.6rem] basis-[2.6rem])',
	],
	['ui-share-primary-actions', '[@media(max-width:520px)]:[&&]:(grid-cols-[minmax(0,_1fr)])'],
	['ui-share-action-main', '[@media(max-width:520px)]:[&&]:([grid-column:auto])'],
	['ui-share-link-row', '[@media(max-width:520px)]:[&&]:(p-[0.6rem])'],
] satisfies UiShortcut[]
