<script lang="ts">
	import { localeTag } from '$lib/i18n/format'
	import { base } from '$app/paths'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
	import { CreatedKhatm } from '$lib/entity/CreatedKhatm'
	import { onMount, type Snippet } from 'svelte'
	import { slide } from 'svelte/transition'
	import IconMenuBook from '~icons/ic/round-menu-book'
	import IconArrow from '~icons/ic/round-arrow-back'
	import * as m from '$lib/paraglide/messages.js'

	type Props = {
		/** حداکثر چند آیتم رندر شود؟ */
		limit?: number
		title?: string
		fallback?: Snippet
	}

	const props: Props = $props()

	let loading = $state(true)
	let hasMore = $state(false)
	let history = $state<CreatedKhatm[]>()

	onMount(async () => {
		const limit = props.limit ? props.limit + 1 : undefined
		const list = await CreatedKhatm.getList(limit)
		loading = false
		if (props.limit && list.length > props.limit) {
			list.length = props.limit
			hasMore = true
		}
		history = list
	})
</script>

{#if history?.length}
	<section
		transition:slide={{ axis: 'y' }}
		class="ui-card ui-card-bordered ui-activity-card ui-activity-card-khatm"
	>
		<div class="ui-card-body">
			<header class="ui-activity-header">
				<span class="ui-activity-header-icon"><IconMenuBook /></span>
				<div class="ui-activity-heading">
					<h2>{props.title || m.history_created()}</h2>
					<p>{m.history_started_groups()}</p>
				</div>
				<span class="ui-activity-count">{history.length.toLocaleString(localeTag())}</span>
			</header>

			<ul class="ui-activity-list ui-khatm-card-list">
				{#each history as item}
					<li>
						<KhatmListCard
							khatm={item.khatm}
							meta={m.history_created_at({ date: item.khatm.plain.created.toLocaleDateString() })}
						/>
					</li>
				{/each}
			</ul>

			{#if hasMore}
				<div class="ui-activity-footer">
					<a class="ui-btn ui-btn-ghost ui-btn-sm" href={localizeHref(`${base}/history`)}>
						{m.history_view_all()}
						<IconArrow />
					</a>
				</div>
			{/if}
		</div>
	</section>
{:else if !loading}
	{@render props.fallback?.()}
{/if}
