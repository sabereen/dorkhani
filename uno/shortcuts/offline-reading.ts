import type { UiShortcut } from '../types'

export default [
	['ui-offline-reading', '[&&]:(w-full max-w-208 ms-auto me-auto)'],
	['ui-offline-reading-toolbar', '[&&]:(justify-between mb-4 ui-row)'],
	['ui-offline-reading-toolbar', '[&&>*+*]:(ms-3)'],
] satisfies UiShortcut[]
