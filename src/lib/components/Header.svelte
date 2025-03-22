<script lang="ts">
	import type { Snippet } from 'svelte'

	type Props = {
		title: string
		start?: Snippet
		end?: Snippet
	}

	const { title = '', end, start }: Props = $props()
</script>

<div class="navbar bg-base-100 shadow-sm">
	<div class="navbar-start">{@render start?.()}</div>
	<div class="navbar-center">
		<h1 class="text-xl font-black">{title}</h1>
	</div>
	<div class="navbar-end">{@render end?.()}</div>
</div>
