import { settingsStore } from '$lib/storage/client'
import { defineCustomClientStrategy, type Locale } from '$lib/paraglide/runtime.js'
import { apiRequest } from '$lib/utility/request'

defineCustomClientStrategy('custom-preference', {
	getLocale: () => undefined,
	setLocale: async (locale) => {
		const settings = settingsStore.getOrDefault<Record<string, unknown>>('localSettings', {})
		await settingsStore.set('localSettings', { ...settings, locale })
		try {
			await apiRequest('POST', '/locale', { body: { locale }, origin: location.origin })
		} catch {
			// Cookie and local settings are still persisted by the client runtime.
		}
	},
})

export function localeLabel(locale: Locale) {
	return locale === 'fa' ? 'فارسی' : locale === 'ar' ? 'العربية' : 'English'
}
