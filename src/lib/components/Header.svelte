<script lang="ts">
	import { base } from '$app/paths'
	import type { Snippet } from 'svelte'
	import IconBack from '~icons/ic/round-arrow-forward-ios'
	import IconSettings from '~icons/ic/round-settings'
	import { navigating } from '$app/state'
	import { goto } from '$app/navigation'

	type Props = {
		title?: string
		link?: string
		start?: Snippet
		end?: Snippet
	}

	const { title, link, end, start }: Props = $props()

	const from = navigating.from

	function back() {
		if (from) {
			history.back()
		} else {
			goto(`${base}/`, { replaceState: true })
		}
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
		{#if title}
			<h1 class="select-none text-xl font-black">
				{#if link}
					<a href={link}>{title}</a>
				{:else}
					{title}
				{/if}
			</h1>
		{/if}
	</div>
	<div class="navbar-end flex items-center">
		{#if end}
			{@render end()}
		{:else}
			<a href={`${base}/settings`} class="btn btn-circle !btn-ghost" aria-label="Settings">
				<IconSettings />
			</a>
		{/if}
	</div>
</div>
