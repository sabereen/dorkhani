<script lang="ts" generics="TabSlug">
	type TabItem<TabSlug> = {
		title: string
		slug: TabSlug
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
	class="bg-#dadadb relative grid select-none rounded-[9px] p-0.5"
	style:grid-template-columns={`repeat(${tabs.length}, 1fr)`}
>
	<div
		style:width={`${100 / tabs.length}%`}
		style:transform={`translate3d(${-100 * selectedIndex}%, 0, 0)`}
		class="z-9 absolute inset-0 p-[2px] transition-transform"
	>
		<div class="indicator"></div>
	</div>

	{#each tabs as { slug, title }, i}
		{@const htmlId = `${id}-tab-${slug}`}
		<input type="radio" name="tab" id={htmlId} value={slug} bind:group={value} class="tab" />
		<label class="tab_label" for={htmlId}>{title}</label>
	{/each}
</div>

<style>
	.indicator {
		content: '';
		height: 36px;
		width: 100%;
		background: #ffffff;
		border: 0.5px solid rgba(0, 0, 0, 0.04);
		box-shadow:
			0px 3px 8px rgba(0, 0, 0, 0.12),
			0px 3px 1px rgba(0, 0, 0, 0.04);
		border-radius: 7px;
	}

	.tab {
		width: 100%;
		height: 36px;
		position: absolute;
		z-index: 99;
		outline: none;
		opacity: 0;
	}
	.tab:focus-visible + .tab_label {
		outline: 2px solid rgba(0, 0, 0, 0.4);
	}

	.tab_label {
		width: 100%;
		height: 36px;
		position: relative;
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 0;
		opacity: 0.6;
		cursor: pointer;
	}
</style>
