<script lang="ts" generics="T">
	import type { Snippet } from 'svelte'
	import { cubicOut } from 'svelte/easing'
	import type { TransitionConfig } from 'svelte/transition'

	type Props = {
		items: T[]
		title: Snippet<[item: T, index: number, selected: boolean]>
		content: Snippet<[item: T, index: number, selected: boolean]>
		selectedIndex?: number
	}
	let { items, selectedIndex = $bindable(), title, content }: Props = $props()
	const id = $props.id()

	function gridRows(node: Element): TransitionConfig {
		const prefersReducedMotion =
			node.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ??
			false

		return {
			duration: prefersReducedMotion ? 0 : 250,
			easing: cubicOut,
			css: (t) => `grid-template-rows: ${t}fr`,
		}
	}
</script>

<div class="ui-join">
	{#each items as item, i (i)}
		{@const selected = i === selectedIndex}
		<section class="ui-join-item ui-border border">
			<button
				id={`${id}_accordion_trigger_${i}`}
				class="ui-accordion-trigger"
				type="button"
				aria-expanded={selected}
				aria-controls={`${id}_accordion_panel_${i}`}
				onclick={() => (selectedIndex = selected ? -1 : i)}
			>
				{@render title(item, i, selected)}
			</button>
			{#if selected}
				<div
					id={`${id}_accordion_panel_${i}`}
					class="ui-accordion-panel"
					role="region"
					aria-labelledby={`${id}_accordion_trigger_${i}`}
					transition:gridRows
				>
					<div class="ui-accordion-panel-inner">
						{@render content(item, i, selected)}
					</div>
				</div>
			{/if}
		</section>
	{/each}
</div>
