import type { Locale } from '$lib/paraglide/runtime.js'

export const supportedLocales = ['fa', 'ar', 'en'] as const satisfies readonly Locale[]
export const PARAGLIDE_LOCALE_COOKIE = 'PARAGLIDE_LOCALE'
export const INTERNAL_LOCALE_HEADER = 'x-dorkhani-resolved-locale'

export type LocaleResolutionSource =
	| 'admin'
	| 'cookie'
	| 'client'
	| 'account'
	| 'url'
	| 'browser'
	| 'fallback'

export type LocaleResolution = {
	locale: Locale
	source: LocaleResolutionSource
	needsLocaleChoice: boolean
}

export function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && supportedLocales.includes(value as Locale)
}

export function localeDirection(locale: Locale) {
	return locale === 'en' ? 'ltr' : 'rtl'
}

export function findPreferredArabicLocale(languages: readonly string[]): Locale | undefined {
	const normalized = languages.map((language) => language.trim().toLowerCase())
	if (normalized.some((language) => language === 'fa' || language.startsWith('fa-'))) return 'fa'
	if (normalized.some((language) => language === 'ar' || language.startsWith('ar-'))) return 'ar'
	return undefined
}

export function parseAcceptLanguage(value: string | null): string[] {
	if (!value) return []
	return value
		.split(',')
		.map((part) => part.split(';')[0]?.trim())
		.filter((part): part is string => Boolean(part))
}

export function localeFromPathname(pathname: string): Locale | undefined {
	const firstSegment = pathname.replace(/^\/+/, '').split('/')[0]?.toLowerCase()
	return firstSegment === 'ar' || firstSegment === 'en' ? firstSegment : undefined
}

export function isAdminPath(pathname: string) {
	return /^(?:\/(?:ar|en))?\/(?:admin|api\/admin)(?:\/|$)/.test(pathname)
}

export function resolveRequestLocale(input: {
	pathname: string
	cookieLocale?: string | null
	clientLocale?: string | null
	accountLocale?: string | null
	acceptLanguage?: string | null
}): LocaleResolution {
	if (isAdminPath(input.pathname)) {
		return { locale: 'fa', source: 'admin', needsLocaleChoice: false }
	}
	if (isLocale(input.cookieLocale)) {
		return { locale: input.cookieLocale, source: 'cookie', needsLocaleChoice: false }
	}
	if (isLocale(input.clientLocale)) {
		return { locale: input.clientLocale, source: 'client', needsLocaleChoice: false }
	}
	if (isLocale(input.accountLocale)) {
		return { locale: input.accountLocale, source: 'account', needsLocaleChoice: false }
	}
	const urlLocale = localeFromPathname(input.pathname)
	if (urlLocale) return { locale: urlLocale, source: 'url', needsLocaleChoice: false }
	const browserLocale = findPreferredArabicLocale(parseAcceptLanguage(input.acceptLanguage ?? null))
	if (browserLocale) {
		return { locale: browserLocale, source: 'browser', needsLocaleChoice: false }
	}
	return { locale: 'fa', source: 'fallback', needsLocaleChoice: true }
}

export function resolveClientLocale() {
	const browserLocale = findPreferredArabicLocale(navigator.languages ?? [navigator.language])
	if (browserLocale) return browserLocale
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
	if (timeZone === 'Asia/Tehran' || timeZone === 'Asia/Kabul') return 'fa'
	return undefined
}
