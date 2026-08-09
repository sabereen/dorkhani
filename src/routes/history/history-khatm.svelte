<script lang="ts">
	import { CreatedKhatm } from '$lib/entity/CreatedKhatm'
	import { onMount, type Snippet } from 'svelte'
	import { slide } from 'svelte/transition'
	import { base } from '$app/paths'

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
	<section transition:slide={{ axis: 'y' }} class="ui-card ui-card-bordered ui-bg-muted">
		<div class="ui-card-body">
			{#if props.title}
				<h2 class="ui-card-title">{props.title}</h2>
			{/if}
			<ul class="ui-list">
				{#each history as item}
					<li class="ui-list-row !flex !flex-col">
						<span>
							<strong>ختم:</strong>
							«<a class="ui-link" href={item.khatm.link}>{item.khatm.title}</a>»
							{#if item.khatm.private}
								<span class="ui-badge ui-badge-xs ui-badge-info">خصوصی</span>
							{/if}
							{#if !item.khatm.isFree}
								<span class="ui-badge ui-badge-xs">{item.khatm.rangeTypeTitle}</span>
							{/if}
						</span>
						<span>
							<strong>تاریخ:</strong>
							{item.khatm.plain.created.toLocaleString('fa-IR')}
						</span>
					</li>
				{/each}
				{#if hasMore}
					<li class="ui-list-row">
						<a class="ui-btn ui-btn-outline" href={`${base}/history`}>
							نمایش همه‌ی موارد...
						</a>
					</li>
				{/if}
			</ul>
		</div>
	</section>
{:else if !loading}
	{@render props.fallback?.()}
{/if}
