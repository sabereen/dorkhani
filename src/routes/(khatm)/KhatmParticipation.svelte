<script lang="ts">
	import { formatPercent, localeTag } from '$lib/i18n/format'
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import type { KhatmParticipationRound } from '$lib/entity/KhatmParticipation.svelte'
	import type { PickedKhatmPart } from '$lib/entity/PickedKhatmPart'
	import { slide } from 'svelte/transition'
	import IconVolunteer from '~icons/ic/round-volunteer-activism'
	import IconExpand from '~icons/ic/round-expand-more'
	import IconBook from '~icons/ic/round-menu-book'
	import * as m from '$lib/paraglide/messages.js'

	type Props = {
		khatm: Khatm
	}

	let { khatm }: Props = $props()
	let expanded = $state(false)
	const componentId = $props.id()
	const toggleId = componentId + '-toggle'
	const detailsId = componentId + '-details'

	const participation = $derived(khatm.participation)
	const verseCount = $derived(participation.currentVerseCount)
	const percent = $derived(participation.currentPercent)
	const currentItems = $derived(participation.currentItems)
	const rounds = $derived(participation.rounds)
	const hasDetails = $derived(
		khatm.isSerial ? rounds.length > 0 : !khatm.isAyahOriented && currentItems.length > 0,
	)

	function getRoundTitle(roundNumber: number) {
		if (roundNumber === 1) return m.round_first()
		if (roundNumber === 2) return m.round_second()
		return m.round_number({ number: roundNumber.toLocaleString(localeTag()) })
	}
</script>

{#snippet rangeItem(item: PickedKhatmPart)}
	<li>
		<div>
			<strong>{item.range.getTitle()}</strong>
			<time datetime={item.date.toISOString()}>{item.date.toLocaleDateString(localeTag())}</time>
		</div>
		<a
			class="ui-btn ui-btn-icon ui-btn-ghost ui-btn-sm"
			target="_blank"
			rel="noopener"
			href={item.range.getLink(item.khatm)}
			aria-label={m.khatm_read_range({ range: item.range.getTitle() })}
		>
			<IconBook />
		</a>
	</li>
{/snippet}

{#snippet roundDetails(round: KhatmParticipationRound)}
	<section class="ui-khatm-my-round">
		<header>
			<strong>{getRoundTitle(round.roundNumber)}</strong>
			<span>{m.khatm_verse_count({ count: round.verseCount.toLocaleString(localeTag()) })}</span>
		</header>
		{#if !khatm.isAyahOriented}
			<ul class="ui-khatm-my-ranges">
				{#each round.items as item (item.date.getTime() + item.range.start)}
					{@render rangeItem(item)}
				{/each}
			</ul>
		{/if}
	</section>
{/snippet}

<section class="ui-khatm-my-participation" aria-labelledby={`${componentId}-title`}>
	<div class="ui-khatm-my-summary">
		<span class="ui-khatm-my-icon" aria-hidden="true"><IconVolunteer /></span>
		<div class="ui-khatm-my-copy" aria-live="polite">
			<h2 id={`${componentId}-title`}>{m.khatm_my_participation()}</h2>
			{#if participation.loaded}
				<p>
					<strong>{verseCount.toLocaleString(localeTag())}</strong>
					<span>{m.khatm_verses_in_round({ period: khatm.isSerial ? m.khatm_current_round() : m.khatm_current_khatm() })}</span>
				</p>
			{:else}
				<div class="ui-khatm-my-loading" role="status">
					<span class="ui-spinner"></span>
					<span>{m.khatm_reading_history_loading()}</span>
				</div>
			{/if}
		</div>
		{#if participation.loaded}
			<span class="ui-khatm-my-percent">{m.khatm_percent_of_quran({ percent: formatPercent(percent) })}</span>
		{/if}
	</div>

	{#if participation.loaded}
		<progress
			class="ui-progress ui-khatm-my-progress"
			max={100}
			value={percent}
			aria-label={m.khatm_participation_progress_aria()}
		></progress>
		{#if verseCount === 0}
			<p class="ui-khatm-my-empty">
				{m.khatm_no_participation({ period: khatm.isSerial ? m.khatm_current_round() : m.khatm_current_khatm() })}
			</p>
		{/if}

		{#if hasDetails}
			<button
				id={toggleId}
				type="button"
				class="ui-khatm-my-toggle"
				aria-expanded={expanded}
				aria-controls={detailsId}
				onclick={() => (expanded = !expanded)}
			>
				<span>{khatm.isSerial ? m.khatm_show_all_rounds() : m.khatm_show_picked_ranges()}</span>
				<IconExpand class={expanded ? 'ui-khatm-my-toggle-open' : ''} />
			</button>
		{/if}
	{/if}

	{#if expanded && hasDetails}
		<div
			id={detailsId}
			class="ui-khatm-my-details"
			role="region"
			aria-labelledby={toggleId}
			transition:slide={{ duration: 180 }}
		>
			{#if khatm.isSerial}
				{#each rounds as round (round.khatmId)}
					{@render roundDetails(round)}
				{/each}
			{:else}
				<ul class="ui-khatm-my-ranges">
					{#each currentItems as item (item.date.getTime() + item.range.start)}
						{@render rangeItem(item)}
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</section>
