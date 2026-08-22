import '@inlang/paraglide-js/urlpattern-polyfill'
import { deLocalizeUrl } from '$lib/paraglide/runtime.js'
import type { Reroute } from '@sveltejs/kit'
import { env } from '$env/dynamic/public'

export const reroute: Reroute = ({ url }) => {
	const pathname = deLocalizeUrl(url).pathname
	if (env.PUBLIC_BUILD_TARGET === 'capacitor' && /^\/(?:admin|api\/admin)(?:\/|$)/.test(pathname)) {
		return '/native-admin'
	}
	return pathname
}
