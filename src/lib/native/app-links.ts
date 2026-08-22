import { goto } from '$app/navigation'
import { isCapacitorBuild } from '$lib/config/runtime'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { createNativeLinkHandler } from './deep-links'

export async function initializeNativeAppLinks() {
	if (!isCapacitorBuild || Capacitor.getPlatform() !== 'android') return () => {}

	let active = true
	const handleLink = createNativeLinkHandler(async (target) => {
		if (active) await goto(target)
	})
	const listener = await App.addListener('appUrlOpen', ({ url }) => {
		void handleLink(url)
	})
	const launch = await App.getLaunchUrl()
	if (launch?.url) await handleLink(launch.url)

	return () => {
		active = false
		void listener.remove()
	}
}
