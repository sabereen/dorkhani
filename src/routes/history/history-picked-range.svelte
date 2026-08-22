<script lang="ts">
	import { localeTag } from '$lib/i18n/format'
	import { base } from '$app/paths'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import { PickedKhatmPart } from '$lib/entity/PickedKhatmPart'
	import RangeTypeIcon from '$lib/components/RangeTypeIcon.svelte'
	import { onMount, type Snippet } from 'svelte'
	import { slide } from 'svelte/transition'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconEye from '~icons/ic/outline-remove-red-eye'
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
	let history = $state<PickedKhatmPart[]>()

	onMount(async () => {
		const limit = props.limit ? props.limit + 1 : undefined
		const list = await PickedKhatmPart.getList(limit)
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
		class="ui-card ui-card-bordered ui-activity-card ui-activity-card-picked"
	>
		<div class="ui-card-body">
			<header class="ui-activity-header">
				<span class="ui-activity-header-icon"><IconCheck /></span>
				<div class="ui-activity-heading">
					<h2>{props.title || m.history_latest_picks()}</h2>
					<p>{m.history_picked_description()}</p>
				</div>
				<span class="ui-activity-count">{history.length.toLocaleString(localeTag())}</span>
			</header>

			<ul class="ui-activity-list">
				{#each history as item}
					<li>
						<div class="ui-activity-item">
							<span class="ui-activity-marker" aria-hidden="true"></span>
							<span class="ui-activity-content">
								<strong>{item.range.getTitle()}</strong>
								<a class="ui-activity-subtitle" href={item.khatm.link}
									>{m.history_from_khatm({ title: item.khatm.title })}</a
								>
								<span class="ui-activity-meta">
									<span>{item.date.toLocaleDateString('fa-IR')}</span>
									{#if item.khatm.private}
										<span class="ui-badge ui-badge-xs ui-badge-info">{m.history_private()}</span>
									{/if}
									{#if !item.khatm.isFree}
										<span class="ui-badge ui-badge-xs ui-range-type-badge">
											<RangeTypeIcon type={item.khatm.rangeType} />
											{item.khatm.rangeTypeTitle}
										</span>
									{/if}
								</span>
							</span>
							<a
								class="ui-btn ui-btn-icon ui-btn-ghost ui-btn-sm ui-activity-view"
								target="_blank"
								rel="noopener"
								href={item.range.getLink(item.khatm)}
								aria-label={m.history_view({ title: item.range.getTitle() })}
							>
								<IconEye />
							</a>
						</div>
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
