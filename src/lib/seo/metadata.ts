import { base } from '$app/paths'
import { publicWebUrl } from '$lib/config/runtime'
import type { Locale } from '$lib/paraglide/runtime.js'

export type JsonLd = Record<string, unknown> | ReadonlyArray<Record<string, unknown>>

export type SeoMeta = {
	title: string
	description: string
	canonicalPath: string
	imagePath: string
	imageAlt: string
	locale: Locale
	robots?: string
	type?: 'website' | 'article'
	jsonLd?: JsonLd
}

export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export function absolutePublicUrl(path: string, currentOrigin?: string) {
	return publicWebUrl(path, currentOrigin)
}

export function localeCode(locale: Locale) {
	return locale === 'fa' ? 'fa_IR' : locale === 'ar' ? 'ar_AR' : 'en_US'
}

export function localizedCanonicalPaths(pathname: string) {
	const withoutBase = base && pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname
	const contentPath = withoutBase.replace(/^\/(?:ar|en)(?=\/|$)/, '') || '/'
	const withLocale = (locale: Locale) => `${base}${locale === 'fa' ? '' : `/${locale}`}${contentPath}`
	return { fa: withLocale('fa'), ar: withLocale('ar'), en: withLocale('en') }
}

export function serializeJsonLd(value: JsonLd) {
	return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}
