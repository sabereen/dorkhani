<script lang="ts">
	import '@unocss/reset/tailwind-compat.css'
	import 'virtual:uno.css'
	import '../app.css'
	import TheToast from '$lib/components/TheToast.svelte'
	import TheFooter from '$lib/components/TheFooter.svelte'
	import BaleMiniApp from '$lib/components/BaleMiniApp.svelte'
	import EitaaMiniApp from '$lib/components/EitaaMiniApp.svelte'
	import type { LayoutProps } from './$types'
	import { LocalSettings } from '$lib/entity/LocalSettings.svelte'
	import { claimCreatedKhatms } from '$lib/auth/claimCreatedKhatms'
	import { onMount } from 'svelte'

	let { children, data }: LayoutProps = $props()

	LocalSettings.provide()
	const localSettings = LocalSettings.use()

	onMount(() => {
		if (data.user) void claimCreatedKhatms()
	})

	$effect(() => {
		const colorScheme = localSettings.config.colorScheme
		if (colorScheme === 'system') {
			delete document.documentElement.dataset.colorScheme
		} else {
			document.documentElement.dataset.colorScheme = colorScheme
		}

		const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
		const darkScheme = window.matchMedia('(prefers-color-scheme: dark)')
		const syncThemeColor = () => {
			const isDark = colorScheme === 'dark' || (colorScheme === 'system' && darkScheme.matches)
			themeColor?.setAttribute('content', isDark ? '#07110f' : '#f7f5ef')
		}

		syncThemeColor()
		if (colorScheme === 'system') darkScheme.addListener(syncThemeColor)

		return () => {
			if (colorScheme === 'system') darkScheme.removeListener(syncThemeColor)
		}
	})
</script>

<BaleMiniApp enabled={data.authProviders.bale} />
<EitaaMiniApp enabled={data.authProviders.eitaa} />

<main class="ui-main ui-container ui-page">
	{@render children()}
</main>

{#await import('$lib/components/TheBProgress.svelte') then { default: TheBProgress }}
	<TheBProgress />
{/await}

<div class="z-1000 relative">
	<TheToast />
</div>

<TheFooter class="mt-5" supportLink={data.supportLink} />
