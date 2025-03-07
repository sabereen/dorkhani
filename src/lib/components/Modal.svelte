<script lang="ts">
	import type { Snippet } from 'svelte'
	import { fade, scale } from 'svelte/transition'

	let { open = $bindable(false), children = null as null | Snippet } = $props()
</script>

<input class="modal-toggle" type="checkbox" hidden bind:checked={open} />

{#if open}
	<div class="modal" transition:fade>
		<button type="button" aria-label="close" class="absolute inset-0" onclick={() => (open = false)}
		></button>
		<div class="modal-box" transition:scale|global={{ start: 0.8, opacity: 0 }}>
			{@render children?.()}
		</div>
	</div>
{/if}
