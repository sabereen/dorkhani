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
</script>

<div class="join join-vertical flex! flex-col">
	{#each items as item, i (i)}
		{@const inputId = `${id}_accardeon_${i}`}
		{@const selected = i === selectedIndex}
		<div class="join-item flex flex-col border border-gray-500">
			<input
				type="radio"
				class="peer size-0 min-h-0 overflow-hidden opacity-0"
				name={`${id}_accardeon`}
				id={inputId}
				value={i}
				bind:group={selectedIndex}
			/>
			<label class="block cursor-pointer peer-focus-visible:ring" for={inputId}>
				{@render title(item, i, selected)}
			</label>
			{#if selected}
				<div in:fly={{ y: 50, duration: 250 }} class="peer-focus-visible:ring">
					{@render content(item, i, selected)}
				</div>
			{/if}
		</div>
	{/each}
</div>
