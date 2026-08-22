<script lang="ts">
	import { page } from '$app/state'
	import { base } from '$app/paths'
	import { DEFAULT_BRANDING_CONFIG, getPublicBranding } from '$lib/entity/Branding'
	import { getLocale } from '$lib/paraglide/runtime.js'

	const { title }: { title: string } = $props()
	const branding = $derived(
		page.data.branding ?? getPublicBranding(DEFAULT_BRANDING_CONFIG, getLocale(), base),
	)
</script>

<svelte:head><title>{title} | {branding.name}</title></svelte:head>
