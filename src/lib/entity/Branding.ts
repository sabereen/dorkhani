import type { Locale } from '$lib/paraglide/runtime.js'
import type { PublicBranding } from '$lib/contracts/domain'

export type { PublicBranding } from '$lib/contracts/domain'

export type BrandingText = {
	name: string
	tagline: string
	heroTitle: string
	heroHighlight: string
	heroDescription: string
	heroImageAlt: string
	seoTitle: string
	seoDescription: string
}

export type BrandingConfig = {
	texts: Record<Locale, BrandingText>
	revision: string
}

const fa: BrandingText = {
	name: 'ختم جمعی قرآن',
	tagline: 'هر آیه، یک قدم روشن',
	heroTitle: 'هر آیه، یک قدم؛',
	heroHighlight: 'هر همراه، یک نور',
	heroDescription:
		'یک ختم گروهی بسازید، آن را با عزیزانتان به اشتراک بگذارید و قدم‌به‌قدم تا پایان قرآن کنار هم بمانید.',
	heroImageAlt: 'دروازه‌ای نورانی به سوی قرآن',
	seoTitle: 'ختم جمعی قرآن | هر آیه، یک قدم روشن',
	seoDescription:
		'ختم قرآن را با دوستان و خانواده آغاز کنید، بازه‌های قرائت را میان همراهان تقسیم کنید و پیشرفت جمع را یک‌جا ببینید.',
}

export const DEFAULT_BRANDING_CONFIG: BrandingConfig = {
	texts: {
		fa,
		ar: {
			name: 'الختم الجماعي للقرآن',
			tagline: 'كل آية، خطوة مضيئة',
			heroTitle: 'كل آية، خطوة؛',
			heroHighlight: 'وكل رفيق، نور',
			heroDescription:
				'أنشئ ختمة جماعية وشاركها مع أحبائك، وواصلوا معًا خطوة بخطوة حتى إتمام القرآن.',
			heroImageAlt: 'بوابة مضيئة نحو القرآن',
			seoTitle: 'الختم الجماعي للقرآن | كل آية، خطوة مضيئة',
			seoDescription:
				'ابدأ ختمة قرآن مع الأصدقاء والعائلة، ووزّع مقاطع التلاوة وتابع تقدّم المجموعة في مكان واحد.',
		},
		en: {
			name: 'Group Quran Khatm',
			tagline: 'Every verse, a bright step',
			heroTitle: 'Every verse, one step;',
			heroHighlight: 'Every companion, a light',
			heroDescription:
				'Create a group Quran reading, share it with your loved ones, and stay together step by step until completion.',
			heroImageAlt: 'A luminous gateway toward the Quran',
			seoTitle: 'Group Quran Khatm | Every verse, a bright step',
			seoDescription:
				'Start a Quran reading with friends and family, share reading ranges, and follow the group’s progress in one place.',
		},
	},
	revision: 'default',
}

const brandingTextKeys = [
	'name',
	'tagline',
	'heroTitle',
	'heroHighlight',
	'heroDescription',
	'heroImageAlt',
	'seoTitle',
	'seoDescription',
] as const satisfies readonly (keyof BrandingText)[]

function normalizeText(value: unknown, fallback: BrandingText): BrandingText {
	const input = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
	return Object.fromEntries(
		brandingTextKeys.map((key) => [
			key,
			typeof input[key] === 'string' && input[key] ? input[key] : fallback[key],
		]),
	) as BrandingText
}

export function normalizeBrandingConfig(value: unknown): BrandingConfig {
	const input = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
	const revision = typeof input.revision === 'string' ? input.revision : 'default'
	const configuredTexts =
		input.texts && typeof input.texts === 'object'
			? (input.texts as Record<string, unknown>)
			: undefined
	const legacyFa = normalizeText(input, fa)
	const normalizedFa = normalizeText(configuredTexts?.fa, legacyFa)

	return {
		texts: {
			fa: normalizedFa,
			ar: normalizeText(configuredTexts?.ar, normalizedFa),
			en: normalizeText(configuredTexts?.en, normalizedFa),
		},
		revision,
	}
}

export function getBrandingText(branding: BrandingConfig, locale: Locale): BrandingText {
	return normalizeText(branding.texts[locale], branding.texts.fa)
}

export function getPublicBranding(
	branding: BrandingConfig,
	locale: Locale = 'fa',
	basePath = '',
): PublicBranding {
	const version = encodeURIComponent(branding.revision)
	return {
		...getBrandingText(branding, locale),
		revision: branding.revision,
		heroImageUrl: `${basePath}/branding/hero?v=${version}`,
		icon192Url: `${basePath}/branding/icon/192?v=${version}`,
		icon512Url: `${basePath}/branding/icon/512?v=${version}`,
	}
}
