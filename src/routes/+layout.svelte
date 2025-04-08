<script lang="ts">
	import '@unocss/reset/tailwind.css'
	import 'virtual:uno.css'
	import '../app.css'
	import TheToast from '$lib/components/TheToast.svelte'

	let { children } = $props()
</script>

{@render children()}

<div class="z-1000 relative">
	<TheToast />
</div>
