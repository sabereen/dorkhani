<script lang="ts">
	import '@unocss/reset/tailwind-compat.css'
	import 'virtual:uno.css'
	import '../app.css'
	import TheToast from '$lib/components/TheToast.svelte'
	import TheFooter from '$lib/components/TheFooter.svelte'
	import type { LayoutProps } from './$types'
	import { LocalSettings } from '$lib/entity/LocalSettings.svelte'

	let { children, data }: LayoutProps = $props()

	LocalSettings.provide()
	const localSettings = LocalSettings.use()

	$effect(() => {
		const colorScheme = localSettings.config.colorScheme
		if (colorScheme === 'system') {
			delete document.documentElement.dataset.colorScheme
		} else {
			document.documentElement.dataset.colorScheme = colorScheme
		}
	})
</script>

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
