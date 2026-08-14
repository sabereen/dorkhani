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

	let tablist: HTMLDivElement

	function activateTab(
		event: MouseEvent,
		slug: TabSlug,
		onClick?: (event: MouseEvent) => void,
	) {
		value = slug
		onClick?.(event)
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return

		const currentTab = (event.target as HTMLElement).closest('.ui-tab') as HTMLElement | null
		const tabElements = Array.from(tablist.querySelectorAll<HTMLElement>('.ui-tab'))
		const currentIndex = currentTab ? tabElements.indexOf(currentTab) : -1

		if (currentIndex < 0 || tabElements.length < 2) return

		let nextIndex: number

		if (event.key === 'Home') {
			nextIndex = 0
		} else if (event.key === 'End') {
			nextIndex = tabElements.length - 1
		} else {
			const isRtl = getComputedStyle(tablist).direction === 'rtl'
			const movesForward = event.key === 'ArrowLeft' ? isRtl : !isRtl
			const step = movesForward ? 1 : -1
			nextIndex = (currentIndex + step + tabElements.length) % tabElements.length
		}

		event.preventDefault()
		tabElements[nextIndex].focus()
		tabElements[nextIndex].click()
	}
</script>

<div
	bind:this={tablist}
	id={`${id}-tablist`}
	class="ui-tabs select-none"
	style:grid-template-columns={`repeat(${Math.max(tabs.length, 1)}, minmax(0, 1fr))`}
	role="tablist"
	aria-orientation="horizontal"
	onkeydown={handleKeydown}
>
	{#if tabs.length > 0}
		<div
			style:width={`${100 / tabs.length}%`}
			style:transform={`translate3d(${-100 * Math.max(selectedIndex, 0)}%, 0, 0)`}
			class="ui-tab-indicator"
			class:ui-tab-indicator-hidden={selectedIndex < 0}
			aria-hidden="true"
		>
			<div class="ui-tab-indicator-inner"></div>
		</div>
	{/if}

	{#each tabs as { slug, title, link, onClick, icon: Icon }, index}
		{@const active = value === slug}
		{@const tabId = `${id}-tab-${index}`}
		{#if link}
			<a
				id={tabId}
				href={link}
				class="ui-tab"
				class:ui-tab-active={active}
				role="tab"
				aria-selected={active}
				tabindex={active || (selectedIndex < 0 && index === 0) ? 0 : -1}
				onclick={(event) => activateTab(event, slug, onClick)}
				data-sveltekit-noscroll={noScroll}
			>
				{#if Icon}<span class="ui-tab-icon" aria-hidden="true"><Icon /></span>{/if}
				<span class="ui-tab-label">{title}</span>
			</a>
		{:else}
			<button
				id={tabId}
				type="button"
				class="ui-tab"
				class:ui-tab-active={active}
				role="tab"
				aria-selected={active}
				tabindex={active || (selectedIndex < 0 && index === 0) ? 0 : -1}
				onclick={(event) => activateTab(event, slug, onClick)}
			>
				{#if Icon}<span class="ui-tab-icon" aria-hidden="true"><Icon /></span>{/if}
				<span class="ui-tab-label">{title}</span>
			</button>
		{/if}
	{/each}
</div>
