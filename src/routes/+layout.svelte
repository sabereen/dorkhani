<script lang="ts">
	import '../app.css'
	import TheToast from '$lib/components/TheToast.svelte'
	let { children } = $props()
</script>

{@render children()}

<div class="relative z-1000">
	<TheToast />
</div>
