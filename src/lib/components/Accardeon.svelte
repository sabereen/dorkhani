<script lang="ts" generics="T">
	import type { Snippet } from 'svelte'
	import { fly } from 'svelte/transition'

	type Props = {
		items: T[]
		title: Snippet<[item: T, index: number, selected: boolean]>
		content: Snippet<[item: T, index: number, selected: boolean]>
		selectedIndex?: number
	}
	let { items, selectedIndex = $bindable(), title, content }: Props = $props()
	const id = $props.id()

	function handleKeyboard(event: KeyboardEvent, index: number) {
		if (event.key !== 'Enter' && event.key !== ' ') return
		event.preventDefault()
		selectedIndex = index
	}
</script>

<div class="ui-join">
	{#each items as item, i (i)}
		{@const selected = i === selectedIndex}
		<section class="ui-join-item ui-border border">
			<div
				class="ui-accordion-trigger"
				role="button"
				tabindex="0"
				aria-expanded={selected}
				aria-controls={`${id}_accordion_panel_${i}`}
				onclick={() => (selectedIndex = i)}
				onkeydown={(event) => handleKeyboard(event, i)}
			>
				{@render title(item, i, selected)}
			</div>
			{#if selected}
				<div id={`${id}_accordion_panel_${i}`} in:fly={{ y: 30, duration: 200 }}>
					{@render content(item, i, selected)}
				</div>
			{/if}
		</section>
	{/each}
</div>
