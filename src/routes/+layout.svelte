<script lang="ts">
	import '@unocss/reset/tailwind-compat.css'
	import 'virtual:uno.css'
	import '../app.css'
	import TheToast from '$lib/components/TheToast.svelte'

	let { children } = $props()
</script>

{@render children()}

{#await import('$lib/components/TheBProgress.svelte') then { default: TheBProgress }}
	<TheBProgress />
{/await}

<div class="z-1000 relative">
	<TheToast />
</div>
