<script lang="ts">
	import Modal from '$lib/components/Modal.svelte'
	import { Ayah, Juz, Page, Surah } from '@ghoran/entity'
	import { findNonOverlappingSubranges } from '$lib/utility/findNonOverlappingSubranges'
	import { juz_toRange } from '$lib/entity/Juz'
	import { surah_getName, surah_toRange } from '$lib/entity/Surah'
	import { page_toRange } from '$lib/entity/Page'
	import { QuranRange } from '$lib/entity/Range'
	import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
	import ConfirmRange from '../confirm-range.svelte'
	import { useKathmContext } from '../../khatm-context.svelte'
	import { page } from '$app/state'
	import { pushState } from '$app/navigation'
	import IconGrid from '~icons/ic/round-grid-view'
	import PickedRangeResult from '../PickedRangeResult.svelte'
	import * as m from '$lib/paraglide/messages.js'

	type PageState = {
		modal?: boolean
	}

	const khatmContext = useKathmContext()
	const khatm = $derived(khatmContext.khatm)
	const parts = $derived(khatmContext.parts)
	const rawParts = $derived(khatmContext.rawParts)
	const participation = $derived(khatm.participation)

	let showBadges = $state(false)
	let hideFinishedIntervals = $state(false)
	const juzList = Juz.getAll()
	const surahList = Surah.getAll()
	const pageList = Page.getAll()

	const juzRanges = juzList.map(juz_toRange)
	const surahRanges = surahList.map(surah_toRange)
	const pageRanges = pageList.map(page_toRange)

	const selectableJuzParts = $derived(findNonOverlappingSubranges(parts, juzRanges))
	const selectableSurahParts = $derived(findNonOverlappingSubranges(parts, surahRanges))
	const selectablePageParts = $derived(findNonOverlappingSubranges(parts, pageRanges))

	const gridTemplateRows = $derived.by(() => {
		if (!hideFinishedIntervals || parts.length === 0) return null

		let rows: string[] = []
		let currentPartIndex = 0
		for (let i = 0; i < COUNT_OF_AYAHS; i++) {
			let currentPart = parts[currentPartIndex]
			if (currentPart.end === i) {
				currentPartIndex++
				currentPart = parts[currentPartIndex]
				if (!currentPart) break
			}
			if (currentPart.start <= i && currentPart.end > i) {
				rows.push('0')
			} else {
				rows.push('auto')
			}
		}

		return rows.join(' ')
	})

	const modal = $derived(!!(page.state as PageState).modal)

	let selected = $state(new QuranRange(0, 0))
	let picked = $state(false)

	function openModal(start: number, end: number) {
		const range = new QuranRange(start, end)

		// if (!range.matchRangeType(khatm.rangeType)) {
		// 	toast('error', `ختم جاری ${khatm.rangeTypeTitle} است و با این بازه هم‌خوانی ندارد.`)
		// 	return
		// }

		selected = range
		picked = false
		pushState('', { modal: true } satisfies PageState)
	}

	function closeModal() {
		if (modal) history.back()
	}

	function getRangeLabel(startIndex: number, endIndex: number) {
		const start = Ayah.get(startIndex)
		const end = Ayah.get(endIndex - 1)

		return (
			`${surah_getName(start.surah)} ${start.number} – ` +
			`${surah_getName(end.surah)} ${end.number}`
		)
	}
</script>

<section class="ui-khatm-panel ui-khatm-map-panel">
	<div class="ui-khatm-panel-header ui-khatm-map-panel-header">
		<span class="ui-khatm-option-icon"><IconGrid /></span>
		<h2>{m.grid_title()}</h2>
		<p>{m.grid_description()}</p>
	</div>
	<div class="ui-khatm-toolbar ui-khatm-map-toolbar">
		<label class="ui-khatm-check">
			<input type="checkbox" class="ui-checkbox" bind:checked={hideFinishedIntervals} />
			<span>{m.grid_free_ranges_only()}</span>
		</label>
		<label class="ui-khatm-check">
			<input type="checkbox" class="ui-checkbox" bind:checked={showBadges} />
			<span>{m.grid_show_range_ends()}</span>
		</label>
	</div>
	<div>
		<div class="ui-alert ui-alert-info">{m.grid_select_instruction()}</div>
	</div>
	<div class="ui-khatm-map-legend" aria-label={m.grid_legend()}>
		<span><i class="ui-khatm-map-key ui-khatm-map-key-free" aria-hidden="true"></i>{m.grid_free()}</span>
		<span
			><i class="ui-khatm-map-key ui-khatm-map-key-finished" aria-hidden="true"></i>{m.grid_read()}</span
		>
		<span><i class="ui-khatm-map-key ui-khatm-map-key-mine" aria-hidden="true"></i>{m.wizard_my_share()}</span>
	</div>
	<div class="ui-khatm-map">
		<div class="ui-khatm-map-scroll">
			<div class="ui-khatm-map-head" aria-hidden="true">
				<span>{m.grid_juz()}</span><span>{m.grid_surah()}</span><span>{m.grid_page()}</span>
			</div>
			<div class="ui-khatm-map-grid" style:grid-template-rows={gridTemplateRows}>
				{#snippet renderSelectableRanges(ranges: { start: number; end: number }[], column: number)}
					{#each ranges as range (range.start + ':' + range.end)}
						{@const start = Ayah.get(range.start)}
						{@const end = Ayah.get(range.end - 1)}
						{@const label = getRangeLabel(range.start, range.end)}
						<button
							type="button"
							class="ui-khatm-map-selectable col-start-1"
							aria-label={label}
							title={label}
							style:grid-column-start={column}
							style:grid-row-start={range.start + 1}
							style:grid-row-end={range.end + 1}
							style:min-height={hideFinishedIntervals ? '0' : null}
							onclick={() => openModal(range.start, range.end)}
						>
							{#if showBadges}
								<span class="ui-badge ui-badge-xs ui-badge-neutral rounded-l-none rounded-t-none">
									{start.number}
									{surah_getName(start.surah)}
								</span>
								<span class="ui-badge ui-badge-xs ui-badge-neutral rounded-b-none rounded-l-none">
									{end.number}
									{surah_getName(end.surah)}
								</span>
							{/if}
						</button>
					{/each}
				{/snippet}

				{#snippet renderRanges(list: QuranRange[], column: number)}
					{#each list as range (range.title)}
						<div
							class="ui-khatm-map-range"
							title={range.title}
							style:grid-column-start={column}
							style:grid-row-start={range.start + 1}
							style:grid-row-end={range.end + 1}
							style:min-height={hideFinishedIntervals ? '0' : null}
						>
							{range.title}
						</div>
					{/each}
				{/snippet}

				{@render renderSelectableRanges(selectableJuzParts, 1)}
				{@render renderSelectableRanges(selectableSurahParts, 2)}
				{@render renderSelectableRanges(selectablePageParts, 3)}

				{#if !hideFinishedIntervals}
					{#each rawParts as part (part.plain.id)}
						{@const mine = participation.isMine(part)}
						{@const range = part.getRange()}
						{@const label = range.getTitle()}
						<div
							class="ui-khatm-map-picked col-span-3 col-start-1"
							class:ui-khatm-map-finished={!mine}
							class:ui-khatm-map-mine={mine}
							title={`${mine ? m.wizard_my_share() : m.grid_read()}: ${label}`}
							style:grid-row-start={part.start + 1}
							style:grid-row-end={part.end + 1}
						>
							<span class="select-none">
								<strong>{mine ? m.wizard_my_share() : m.grid_read()}</strong>
								<small>{label}</small>
							</span>
						</div>
					{/each}
				{/if}

				{@render renderRanges(juzRanges, 1)}
				{@render renderRanges(surahRanges, 2)}
				{@render renderRanges(pageRanges, 3)}
			</div>
		</div>
	</div>
</section>

<Modal bind:open={() => modal, closeModal}>
	{#if picked}
		<PickedRangeResult {khatm} onClose={closeModal} range={selected} />
	{:else}
		<ConfirmRange
			{khatm}
			onClose={closeModal}
			onFinished={() => (picked = true)}
			range={selected}
		/>
	{/if}
</Modal>
