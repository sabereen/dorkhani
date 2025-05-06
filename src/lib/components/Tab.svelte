<script lang="ts" generics="TabSlug">
	import type { Component } from 'svelte'

	type TabItem<TabSlug> = {
		title: string
		slug: TabSlug
		link?: string
		icon?: Component
	}

	type Props = {
		tabs: TabItem<TabSlug>[]
		value: TabSlug
	}

	let { tabs, value = $bindable() }: Props = $props()

	const id = $props.id()

	const selectedIndex = $derived(tabs.findIndex((t) => t.slug === value))
</script>

<div
	class="relative grid select-none rounded-[9px] p-0.5"
	style:grid-template-columns={`repeat(${tabs.length}, 1fr)`}
>
	<div
		style:width={`${100 / tabs.length}%`}
		style:transform={`translate3d(${-100 * selectedIndex}%, 0, 0)`}
		class="absolute inset-0 p-[2px] transition-transform"
	>
		<div class="indicator bg-base-100 h-[36px] w-full rounded-[7px] shadow-md"></div>
	</div>

	{#each tabs as { slug, title, link, icon: Icon }, i}
		{@const htmlId = `${id}-tab-${slug}`}
		<input
			type="radio"
			name="tab"
			id={htmlId}
			value={slug}
			bind:group={value}
			class="peer absolute size-0 opacity-0 outline-none"
		/>
		<label
			class="relative flex h-[36px] w-full cursor-pointer items-center justify-center border-0 opacity-60 [.peer:focus-visible_+_&]:ring"
			class:text-base-content={value === slug}
			for={htmlId}
		>
			{#if link}
				<a href={link} class="flex grow items-center justify-center self-stretch">
					{#if Icon}<Icon class="me-1" />{/if}
					{title}
				</a>
			{:else}
				{#if Icon}<Icon class="me-1" />{/if}
				{title}
			{/if}
		</label>
	{/each}
</div>
