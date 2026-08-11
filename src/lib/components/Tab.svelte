<script lang="ts" generics="TabSlug">
	import type { Component } from 'svelte'

	type TabItem<TabSlug> = {
		title: string
		slug: TabSlug
		link?: string
		onClick?: (event: MouseEvent) => void
		icon?: Component
	}

	type Props = {
		tabs: TabItem<TabSlug>[]
		value: TabSlug
		noScroll?: boolean
	}

	let { tabs, value = $bindable(), noScroll = false }: Props = $props()

	const id = $props.id()

	const selectedIndex = $derived(tabs.findIndex((t) => t.slug === value))
</script>

<div
	class="ui-tabs select-none"
	style:grid-template-columns={`repeat(${tabs.length}, 1fr)`}
	role="tablist"
>
	<div
		style:width={`${100 / tabs.length}%`}
		style:transform={`translate3d(${-100 * selectedIndex}%, 0, 0)`}
		class="ui-tab-indicator"
		aria-hidden="true"
	>
		<div class="ui-tab-indicator-inner"></div>
	</div>

	{#each tabs as { slug, title, link, onClick, icon: Icon }, i}
		{@const htmlId = `${id}-tab-${slug}`}
		<input
			type="radio"
			name="tab"
			id={htmlId}
			value={slug}
			bind:group={value}
			class="ui-tab-input"
		/>
		<label
			class="ui-tab"
			class:ui-tab-active={value === slug}
			for={htmlId}
			role="tab"
			aria-selected={value === slug}
		>
			{#if link}
				<a
					href={link}
					class="flex grow items-center justify-center self-stretch"
					onclick={onClick}
					data-sveltekit-noscroll={noScroll}
				>
					{#if Icon}<Icon class="ml-1" />{/if}
					{title}
				</a>
			{:else}
				{#if Icon}<Icon class="ml-1" />{/if}
				{title}
			{/if}
		</label>
	{/each}
</div>
