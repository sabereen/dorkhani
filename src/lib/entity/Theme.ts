export const colorSchemes = [
	{ slug: 'system', name: 'سیستم' },
	{ slug: 'light', name: 'روشن' },
	{ slug: 'dark', name: 'تاریک' },
] as const

export type ColorScheme = (typeof colorSchemes)[number]['slug']

export function isManualColorScheme(value: unknown): value is Exclude<ColorScheme, 'system'> {
	return value === 'light' || value === 'dark'
}
