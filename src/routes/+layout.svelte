<script lang="ts">
	import '../app.css'
	import TheToast from '$lib/components/TheToast.svelte'
	let { children } = $props()
</script>

<TheToast />

{@render children()}
