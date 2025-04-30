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
</script>

{@render children()}

{#await import('$lib/components/TheBProgress.svelte') then { default: TheBProgress }}
	<TheBProgress />
{/await}

<div class="z-1000 relative">
	<TheToast />
</div>

<div class="grow"></div>

<TheFooter class="mt-5" supportLink={data.supportLink} />
