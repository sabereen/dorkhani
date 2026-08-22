import { getLocale, type Locale } from '$lib/paraglide/runtime.js'

const localeTags: Record<Locale, string> = {
	fa: 'fa-IR',
	ar: 'ar',
	en: 'en',
}

export function localeTag(locale: Locale = getLocale()) {
	return localeTags[locale]
}

export function formatNumber(value: number, locale: Locale = getLocale()) {
	return new Intl.NumberFormat(localeTag(locale)).format(value)
}

export function formatPercent(value: number, locale: Locale = getLocale()) {
	return new Intl.NumberFormat(localeTag(locale), {
		style: 'percent',
		maximumFractionDigits: 2,
	}).format(value / 100)
}

export function formatDate(
	value: Date | number | string,
	options: Intl.DateTimeFormatOptions = {},
	locale: Locale = getLocale(),
) {
	return new Intl.DateTimeFormat(localeTag(locale), options).format(new Date(value))
}
