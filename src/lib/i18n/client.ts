import { base } from '$app/paths'
import { localStore } from '$lib/utility/localStore'
import { defineCustomClientStrategy, type Locale } from '$lib/paraglide/runtime.js'

defineCustomClientStrategy('custom-preference', {
	getLocale: () => undefined,
	setLocale: async (locale) => {
		const settings = localStore.getOrDefault<Record<string, unknown>>('localSettings', {})
		localStore.set('localSettings', { ...settings, locale })
		try {
			await fetch(`${base}/api/locale`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ locale }),
			})
		} catch {
			// Cookie and local settings are still persisted by the client runtime.
		}
	},
})

export function localeLabel(locale: Locale) {
	return locale === 'fa' ? 'فارسی' : locale === 'ar' ? 'العربية' : 'English'
}

