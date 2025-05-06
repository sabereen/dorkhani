<script lang="ts">
	import type { Snippet } from 'svelte'
	import IconBack from '~icons/ic/round-arrow-forward-ios'

	type Props = {
		title: string
		link?: string
		start?: Snippet
		end?: Snippet
	}

	const { title = '', link, end, start }: Props = $props()

	function back() {
		history.back()
	}
</script>

<div class="navbar bg-base-300 shadow-sm">
	<div class="navbar-start flex items-center">
		{#if start}
			{@render start()}
		{:else}
			<button type="button" class="btn btn-circle !btn-ghost" aria-label="Back" onclick={back}>
				<IconBack />
			</button>
		{/if}
	</div>
	<div class="navbar-center">
		<h1 class="select-none text-xl font-black">
			{#if link}
				<a href={link}>{title}</a>
			{:else}
				{title}
			{/if}
		</h1>
	</div>
	<div class="navbar-end flex items-center">{@render end?.()}</div>
</div>
