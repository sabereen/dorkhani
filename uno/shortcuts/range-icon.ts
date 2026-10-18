import type { UiShortcut } from '../types'

export default [
	['ui-range-type-icon', '[&&]:([color:inherit] ui-inline-center)'],
	['ui-range-type-icon', '[&&_svg]:(block w-full h-full [fill:currentColor])'],
	['ui-range-type-icon', "[&&_svg[fill='none']]:([fill:none])"],
] satisfies UiShortcut[]
