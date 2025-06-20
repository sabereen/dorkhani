<script lang="ts">
	import { onMount, type Snippet } from 'svelte'
	import { slide } from 'svelte/transition'
	import { base } from '$app/paths'
	import { idb_localZekr_getList } from '$lib/idb/localZekr'
	import type { LocalZekr } from '$lib/idb/idb'
	import { Zekr } from '$lib/entity/Zekr.svelte'

	type Props = {
		/** حداکثر چند آیتم رندر شود؟ */
		limit?: number
		title?: string
		fallback?: Snippet
	}

	const props: Props = $props()

	let loading = $state(true)
	let hasMore = $state(false)

	let history = $state<LocalZekr[]>()
	onMount(async () => {
		const limit = props.limit ? props.limit + 1 : undefined
		const list = await idb_localZekr_getList(limit)
		loading = false
		if (props.limit && list.length > props.limit) {
			list.length = props.limit
			hasMore = true
		}
		history = list
	})
</script>

{#if history?.length}
	<section transition:slide={{ axis: 'y' }} class="card card-border bg-base-200">
		<div class="card-body">
			{#if props.title}
				<h2 class="card-title">{props.title}</h2>
			{/if}
			<ul class="list">
				{#each history as item}
					{@const zekr = Zekr.fromPlain(item.zekr)}
					<li class="list-row !flex !flex-col">
						<span>
							<strong>ختم:</strong>
							«<a class="link link-info" href={zekr.link}>{zekr.title}</a>»
							{#if zekr.isFinite}
								<span class="badge badge-xs badge-info">{zekr.targetCount} تایی</span>
							{/if}
						</span>
						<span>
							<strong>تاریخ:</strong>
							{zekr.plain.created.toLocaleString('fa-IR')}
						</span>
					</li>
				{/each}
				{#if hasMore}
					<li class="list-row">
						<a class="btn btn-primary !btn-outline" href={`${base}/history`}>
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
