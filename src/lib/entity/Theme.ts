type DaisyTheme = {
	slug: string
	name: string
}

export const daisyThemes = [
	{ slug: 'light', name: 'روز' },
	{ slug: 'dark', name: 'شب' },
	{ slug: 'cupcake', name: 'شیرینی' },
	{ slug: 'bumblebee', name: 'زردطلایی' },
	{ slug: 'emerald', name: 'زمردین' },
	{ slug: 'corporate', name: 'اداری' },
	{ slug: 'synthwave', name: 'نئون' },
	{ slug: 'retro', name: 'قدیمی' },
	// { slug: 'cyberpunk', name: 'آینده‌نما' },
	// { slug: 'valentine', name: 'عاشقانه' },
	// { slug: 'halloween', name: 'ترسناک' },
	{ slug: 'garden', name: 'بهاری' },
	{ slug: 'forest', name: 'طبیعت' },
	{ slug: 'aqua', name: 'آبی‌آسمانی' },
	{ slug: 'lofi', name: 'ملایم' },
	{ slug: 'pastel', name: 'پاستلی' },
	{ slug: 'fantasy', name: 'رویایی' },
	{ slug: 'wireframe', name: 'ساده‌نما' },
	{ slug: 'black', name: 'مشکی' },
	{ slug: 'luxury', name: 'نخبه' },
	{ slug: 'dracula', name: 'بنفش‌تیره' },
	{ slug: 'cmyk', name: 'رنگین‌کمان' },
	{ slug: 'autumn', name: 'پاییزی' },
	{ slug: 'business', name: 'رسمی' },
	{ slug: 'acid', name: 'اسیدی' },
	{ slug: 'lemonade', name: 'لیمویی' },
	{ slug: 'night', name: 'نیمه‌شب' },
	{ slug: 'coffee', name: 'قهوه‌ای' },
	{ slug: 'winter', name: 'برفی' },
] as const satisfies DaisyTheme[]

export type DaisyThemeSlug = (typeof daisyThemes)[number]['slug']
