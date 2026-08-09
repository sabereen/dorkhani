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

<div class="ui-page-header">
	<div class="ui-page-header-inner">
		<div class="ui-page-header-start">
			{#if start}
				{@render start()}
			{:else}
				<button type="button" class="ui-btn ui-btn-icon ui-btn-ghost" aria-label="بازگشت" onclick={back}>
					<IconBack />
				</button>
			{/if}
		</div>
		<div>
			{#if title}
				<h1 class="ui-page-header-title select-none">
					{#if link}
						<a href={link}>{title}</a>
					{:else}
						{title}
					{/if}
				</h1>
			{/if}
		</div>
		<div class="ui-page-header-end">
			{#if end}
				{@render end()}
			{:else}
				<a href={`${base}/settings`} class="ui-btn ui-btn-icon ui-btn-ghost" aria-label="تنظیمات">
					<IconSettings />
				</a>
			{/if}
		</div>
	</div>
</div>
