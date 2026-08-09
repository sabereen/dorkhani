<script lang="ts">
	import { base } from '$app/paths'
	import { Zekr } from '$lib/entity/Zekr.svelte'
	import type { LocalZekr } from '$lib/idb/idb'
	import { idb_localZekr_getList } from '$lib/idb/localZekr'
	import { onMount, type Snippet } from 'svelte'
	import { slide } from 'svelte/transition'
	import IconArrow from '~icons/ic/round-arrow-back'
	import IconAutoAwesome from '~icons/ic/round-auto-awesome'

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
	<section transition:slide={{ axis: 'y' }} class="ui-card ui-card-bordered ui-activity-card ui-activity-card-zekr">
		<div class="ui-card-body">
			<header class="ui-activity-header">
				<span class="ui-activity-header-icon"><IconAutoAwesome /></span>
				<div class="ui-activity-heading">
					<h2>{props.title || 'ختم‌های ذکر شما'}</h2>
					<p>حلقه‌های ذکری که همراهی کرده‌اید</p>
				</div>
				<span class="ui-activity-count">{history.length.toLocaleString('fa')}</span>
			</header>

			<ul class="ui-activity-list">
				{#each history as item}
					{@const zekr = Zekr.fromPlain(item.zekr)}
					<li>
						<a class="ui-activity-item" href={zekr.link}>
							<span class="ui-activity-marker" aria-hidden="true"></span>
							<span class="ui-activity-content">
								<strong>{zekr.title}</strong>
								<span class="ui-activity-meta">
									<span>{zekr.plain.created.toLocaleDateString('fa-IR')}</span>
									{#if zekr.isFinite}
										<span class="ui-badge ui-badge-xs ui-badge-info"
											>{zekr.targetCount.toLocaleString('fa')} تایی</span
										>
									{/if}
								</span>
							</span>
							<span class="ui-activity-arrow"><IconArrow /></span>
						</a>
					</li>
				{/each}
			</ul>

			{#if hasMore}
				<div class="ui-activity-footer">
					<a class="ui-btn ui-btn-ghost ui-btn-sm" href={`${base}/history`}>
						دیدن همه
						<IconArrow />
					</a>
				</div>
			{/if}
		</div>
	</section>
{:else if !loading}
	{@render props.fallback?.()}
{/if}
