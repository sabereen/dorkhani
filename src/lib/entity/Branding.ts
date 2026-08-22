export type BrandingConfig = {
	name: string
	tagline: string
	heroTitle: string
	heroHighlight: string
	heroDescription: string
	heroImageAlt: string
	seoTitle: string
	seoDescription: string
	revision: string
}

export type PublicBranding = BrandingConfig & {
	heroImageUrl: string
	icon192Url: string
	icon512Url: string
}

export const DEFAULT_BRANDING_CONFIG: BrandingConfig = {
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
	revision: 'default',
}

export function getPublicBranding(
	branding: BrandingConfig,
	basePath = '',
): PublicBranding {
	const version = encodeURIComponent(branding.revision)
	return {
		...branding,
		heroImageUrl: `${basePath}/branding/hero?v=${version}`,
		icon192Url: `${basePath}/branding/icon/192?v=${version}`,
		icon512Url: `${basePath}/branding/icon/512?v=${version}`,
	}
}
