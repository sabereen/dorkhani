import '@inlang/paraglide-js/urlpattern-polyfill'
import { deLocalizeUrl } from '$lib/paraglide/runtime.js'
import type { Reroute } from '@sveltejs/kit'
import { PUBLIC_BUILD_TARGET } from '$env/static/public'

export const reroute: Reroute = ({ url }) => {
	const pathname = deLocalizeUrl(url).pathname
	if (PUBLIC_BUILD_TARGET === 'capacitor' && /^\/(?:admin|api\/admin)(?:\/|$)/.test(pathname)) {
		return '/native-admin'
	}
	return pathname
}
