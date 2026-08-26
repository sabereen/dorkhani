import { PUBLIC_BUILD_TARGET } from '$env/static/public'
import { browser } from '$app/environment'
import { base } from '$app/paths'
import type { LayoutLoad } from './$types'
import type { AppBootstrap } from '$lib/contracts/api'
import { loadApi } from '$lib/utility/request'
import { DEFAULT_BRANDING_CONFIG, getPublicBranding } from '$lib/entity/Branding'
import { isInstalledApp } from '$lib/config/installedApp'
import { isLocale } from '$lib/i18n/locale'

export const ssr = PUBLIC_BUILD_TARGET !== 'capacitor'

export const load: LayoutLoad = async ({ fetch, url, depends }) => {
	depends('app:bootstrap')
	if (browser && isInstalledApp() && /\/offline-khatm(?:\/|$)/.test(url.pathname)) {
		return offlineBootstrap()
	}
	try {
		return await loadApi<AppBootstrap>('/app/bootstrap', { fetch, origin: url.origin })
	} catch (cause) {
		if (!browser || !isInstalledApp()) throw cause
		return offlineBootstrap()
	}
}

function offlineBootstrap(): AppBootstrap {
	let locale: AppBootstrap['locale'] = 'fa'
	try {
		const stored = JSON.parse(localStorage.getItem('app_v1_localSettings') || '{}')
		if (isLocale(stored?.locale)) locale = stored.locale
	} catch {
		// Invalid local settings must not block the offline shell.
	}
	const branding = getPublicBranding(DEFAULT_BRANDING_CONFIG, locale, base)
	return {
		locale,
		needsLocaleChoice: false,
		supportLink: null,
		branding: {
			...branding,
			heroImageUrl: `${base}/hero.png`,
			icon192Url: `${base}/icon-192.png`,
			icon512Url: `${base}/icon-512.png`,
		},
		user: null,
		authProviders: { google: false, eitaa: false, bale: false },
		miniAppUrls: { bale: null, eitaa: null },
	}
}
