<script lang="ts">
	import type { Snippet } from 'svelte'

	type Props = {
		title: string
		link?: string
		start?: Snippet
		end?: Snippet
	}

	const { title = '', link, end, start }: Props = $props()
</script>

<div class="navbar bg-base-300 shadow-sm">
	<div class="navbar-start flex items-center">{@render start?.()}</div>
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
