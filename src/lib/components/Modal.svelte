<script lang="ts">
	import type { Snippet } from 'svelte'
	import { fade, scale } from 'svelte/transition'

	type Props = {
		open?: boolean
		children?: Snippet
		class?: string
		contentClass?: string
	}

	let { open = $bindable(false), children, contentClass, class: className }: Props = $props()

	function close() {
		open = false
	}

	function handleKeyboard(event: KeyboardEvent) {
		if (event.key === 'Escape') close()
	}
</script>

<svelte:document onkeyup={handleKeyboard} />

<input class="modal-toggle" type="checkbox" hidden checked={open} />

{#if open}
	<div class={['modal flex! items-center justify-center', className]} out:fade>
		<button
			in:fade|global
			type="button"
			aria-label="close"
			class="absolute inset-0 size-full cursor-default bg-white/20"
			onclick={close}
		></button>
		<div class={['modal-box', contentClass]} transition:scale|global={{ start: 0.8, opacity: 0 }}>
			{@render children?.()}
		</div>
	</div>
{/if}
