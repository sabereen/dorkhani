<script lang="ts">
	import '@unocss/reset/tailwind-compat.css'
	import 'virtual:uno.css'
	import '../app.css'
	import TheToast from '$lib/components/TheToast.svelte'
	import TheFooter from '$lib/components/TheFooter.svelte'
	import MiniAppHost from '$lib/components/MiniAppHost.svelte'
	import TheBProgress from '$lib/components/TheBProgress.svelte'
	import type { LayoutProps } from './$types'
	import { LocalSettings } from '$lib/entity/LocalSettings.svelte'
	import { claimCreatedKhatms } from '$lib/auth/claimCreatedKhatms'
	import { onMount } from 'svelte'
	import { base } from '$app/paths'
	import LocaleChooser from '$lib/components/LocaleChooser.svelte'
	import { isCapacitorBuild } from '$lib/config/runtime'
	import { localeDirection } from '$lib/i18n/locale'

	let { children, data }: LayoutProps = $props()

	LocalSettings.provide()
	const localSettings = LocalSettings.use()

	onMount(() => {
		if (data.user) void claimCreatedKhatms()
		if (!data.needsLocaleChoice) {
			localSettings.update({ locale: data.locale }, { bypassLocalStore: false })
		}
	})

	$effect(() => {
		document.documentElement.lang = data.locale
		document.documentElement.dir = localeDirection(data.locale)
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

<svelte:head>
	<title>{data.branding.name}</title>
	<link rel="icon" type="image/png" sizes="192x192" href={data.branding.icon192Url} />
	<link rel="apple-touch-icon" href={data.branding.icon192Url} />
	{#if !isCapacitorBuild}
		<link rel="manifest" href={`${base}/manifest.json?v=${data.branding.revision}`} />
	{/if}
	<meta property="og:site_name" content={data.branding.name} />
</svelte:head>

<MiniAppHost
	baleEnabled={data.authProviders.bale}
	eitaaEnabled={data.authProviders.eitaa}
/>

<LocaleChooser unresolved={data.needsLocaleChoice} />

<main class="ui-main ui-container ui-page">
	{@render children()}
</main>

<TheBProgress />

<div class="z-1000 relative">
	<TheToast />
</div>

<TheFooter class="mt-5" supportLink={data.supportLink} />
