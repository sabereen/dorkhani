<script lang="ts">
	import { page } from '$app/state'
	import { base } from '$app/paths'
	import { DEFAULT_BRANDING_CONFIG, getPublicBranding } from '$lib/entity/Branding'

	const { title }: { title: string } = $props()
	const branding = $derived(
		page.data.branding ?? getPublicBranding(DEFAULT_BRANDING_CONFIG, base),
	)
</script>

<svelte:head><title>{title} | {branding.name}</title></svelte:head>
