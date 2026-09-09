<script lang="ts">
	import { formatPercent, localeTag } from '$lib/i18n/format'
	import Modal from '$lib/components/Modal.svelte'
	import { juz_toRange } from '$lib/entity/Juz'
	import { page_toRange } from '$lib/entity/Page'
	import { surah_toRange } from '$lib/entity/Surah'
	import { Juz, Page, Surah, HizbQuarter } from '@ghoran/entity'
	import ConfirmRange from '../confirm-range.svelte'
	import { QuranRange } from '$lib/entity/Range'
	import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
	import { hizbQuarter_toRange } from '$lib/entity/HizbQuarter'
	import { page } from '$app/state'
	import { pushState, replaceState } from '$app/navigation'
	import { useKathmContext } from '../../khatm-context.svelte'
	import IconAll from '~icons/ic/round-done-all'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconSearch from '~icons/ic/round-search'
	import IconArrow from '~icons/ic/round-arrow-back'
	import IconTune from '~icons/ic/round-tune'
	import IconBook from '~icons/ic/round-menu-book'
	import IncompleteRangePicker from './IncompleteRangePicker.svelte'
	import RangeTypeIcon from '$lib/components/RangeTypeIcon.svelte'
	import * as m from '$lib/paraglide/messages.js'

	const khatmContext = useKathmContext()
	const khatm = $derived(khatmContext.khatm)
	const parts = $derived(khatmContext.parts)
	const rawParts = $derived(khatmContext.rawParts)
	const participation = $derived(khatm.participation)

	type RangeType = 'juz' | 'hizbQuarter' | 'page' | 'surah' | 'all'
	type PageState = {
		step?: number
		modal?: boolean
	}

	let hideFinishedIntervals = $state(true)
	let rangeQuery = $state('')
	let visibleRangeLimit = $state(30)

	const modal = $derived(!!(page.state as PageState).modal)
	let selected = $state<QuranRange | null>(null)
	let selectionMode = $state<'direct' | 'subrange'>('direct')

	function select(range: QuranRange, percent: number) {
		selected = range
		selectionMode = percent > 0 && percent < 100 ? 'subrange' : 'direct'
		openModal()
	}

	function finishSubrange(range: QuranRange) {
		selected = range
		closeModalAndNext()
	}

	function openModal() {
		if (modal) return
		pushState('', {
			modal: true,
			step,
		})
	}

	function closeModal() {
		if (modal) history.back()
	}

	function toggleModal(open = !modal) {
		if (open) openModal()
		else closeModal()
	}

	const juzRanges = Juz.getAll().map(juz_toRange)
	const hizbQuarterRanges = HizbQuarter.getAll().map(hizbQuarter_toRange)
	const surahRanges = Surah.getAll().map(surah_toRange)
	const pageRanges = Page.getAll().map(page_toRange)
	const allRanges = $derived(
		new QuranRange(0, COUNT_OF_AYAHS).divideByKahtmParts(parts).map(({ range }) => range),
	)

	let step = $derived((page.state as PageState).step || 1)
	let userRangeType = $state<RangeType>('page')

	// مقدار rangeType منطقا اینجا هیچ وقت ayah نیست.
	// ولی برای جلوگیری از خطای تایپ‌اسکریپتی فقط روی آن شرط گذاشته‌ایم.
	const rangeType = $derived<RangeType>(
		khatm.rangeType === 'free' || khatm.rangeType === 'ayah' ? userRangeType : khatm.rangeType,
	)

	const rangeTypeTitle = $derived(
		{
			juz: m.wizard_range_juz(),
			hizbQuarter: m.wizard_range_hizb(),
			page: m.wizard_range_page(),
			surah: m.wizard_range_surah(),
			all: m.wizard_range_all(),
		}[rangeType],
	)

	function selectRangeType(type: RangeType) {
		userRangeType = type
		rangeQuery = ''
		visibleRangeLimit = 30
		next()
	}

	function next() {
		pushState('', {
			modal,
			step: step + 1,
		} satisfies PageState)
	}

	function closeModalAndNext() {
		replaceState('', {
			modal: false,
			step: step + 1,
		} satisfies PageState)
	}

	function goToStep(n: number) {
		if (n < step) history.go(n - step)
		selected = null
		rangeQuery = ''
		visibleRangeLimit = 30
	}

	function normalizeQuery(value: string) {
		return value
			.trim()
			.toLocaleLowerCase(localeTag())
			.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
			.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
			.replace(/ي/g, 'ی')
			.replace(/ك/g, 'ک')
	}

	const ranges = $derived(
		{
			juz: juzRanges,
			hizbQuarter: hizbQuarterRanges,
			page: pageRanges,
			surah: surahRanges,
			all: allRanges,
		}[rangeType],
	)

	const rangeItems = $derived(
		ranges.map((range) => {
			const myLength = participation.getOverlapLength(range)
			return {
				percent: range.getFillPercent(parts),
				myLength,
				range,
			}
		}),
	)

	const availableRangeCount = $derived(rangeItems.filter(({ percent }) => percent < 100).length)
	const filteredRanges = $derived.by(() => {
		const query = normalizeQuery(rangeQuery)
		return rangeItems.filter(({ range, percent }) => {
			if (hideFinishedIntervals && percent >= 100) return false
			if (!query) return true
			return normalizeQuery(range.title || range.getTitleSurahOrinted()).includes(query)
		})
	})
	const visibleRanges = $derived(filteredRanges.slice(0, visibleRangeLimit))
</script>

{#snippet rangeTypeOption(
	type: RangeType,
	title: string,
	description: string,
	meta: string,
	recommended = false,
)}
	<button
		class="ui-khatm-commitment"
		class:ui-khatm-commitment-recommended={recommended}
		type="button"
		onclick={() => selectRangeType(type)}
	>
		<span class="ui-khatm-commitment-icon">
			{#if type === 'all'}<IconAll />{:else}<RangeTypeIcon {type} />{/if}
		</span>
		<span class="ui-khatm-commitment-copy">
			<span class="ui-khatm-commitment-title">
				<strong>{title}</strong>
			</span>
			<span>{description}</span>
		</span>
		<span class="ui-khatm-commitment-meta">{meta}</span>
		<span class="ui-khatm-commitment-arrow" aria-hidden="true"
			><IconArrow class="ltr:mirror" /></span
		>
	</button>
{/snippet}

{#snippet stepSelectRangeType()}
	<div class="ui-khatm-wizard-heading">
		<span class="ui-khatm-wizard-kicker">{m.wizard_commitment_eyebrow()}</span>
		<h2>{m.wizard_commitment_title()}</h2>
		<p>
			{m.wizard_commitment_description()}
		</p>
	</div>
	<div class="ui-khatm-commitments">
		{@render rangeTypeOption(
			'page',
			m.wizard_one_page(),
			m.wizard_one_page_description(),
			m.wizard_short(),
			true,
		)}
		{@render rangeTypeOption(
			'hizbQuarter',
			m.wizard_one_hizb(),
			m.wizard_one_hizb_description(),
			m.wizard_brief(),
		)}
		{@render rangeTypeOption(
			'juz',
			m.wizard_one_juz(),
			m.wizard_one_juz_description(),
			m.wizard_continuous(),
		)}
		{@render rangeTypeOption(
			'surah',
			m.wizard_one_surah(),
			m.wizard_one_surah_description(),
			m.wizard_meaningful(),
		)}
		{#if khatm.progress > 0.9}
			{@render rangeTypeOption(
				'all',
				m.wizard_all_remaining(),
				m.wizard_all_remaining_description(),
				m.wizard_finale(),
			)}
		{/if}
	</div>
{/snippet}

{#snippet stepSelectRange()}
	<div class="ui-khatm-range-heading">
		<div>
			<span class="ui-khatm-wizard-kicker"
				>{m.wizard_select_range_eyebrow({ rangeType: rangeTypeTitle })}</span
			>
			<h2>{m.wizard_select_range_title()}</h2>
			<p>{m.wizard_available_ranges({ count: availableRangeCount.toLocaleString(localeTag()) })}</p>
		</div>
		{#if khatm.rangeType === 'free'}
			<button type="button" class="ui-btn ui-btn-soft ui-btn-sm" onclick={() => goToStep(1)}>
				<IconTune />
				{m.wizard_change_commitment()}
			</button>
		{/if}
	</div>

	{#if ranges.length > 12}
		<div class="ui-khatm-range-search">
			<label for="khatm-range-search">{m.wizard_search_range({ rangeType: rangeTypeTitle })}</label>
			<div>
				<IconSearch aria-hidden="true" />
				<input
					id="khatm-range-search"
					class="ui-input"
					type="search"
					placeholder={m.wizard_search_placeholder({ rangeType: rangeTypeTitle })}
					bind:value={rangeQuery}
					oninput={() => (visibleRangeLimit = 30)}
				/>
			</div>
		</div>
	{/if}

	<div class="ui-khatm-range-tools">
		<div class="ui-khatm-range-legend" aria-label={m.wizard_range_legend()}>
			<span><i class="ui-khatm-range-key ui-khatm-range-key-free"></i>{m.wizard_fully_free()}</span>
			<span
				><i class="ui-khatm-range-key ui-khatm-range-key-partial"
				></i>{m.wizard_partially_free()}</span
			>
			<span><i class="ui-khatm-range-key ui-khatm-range-key-mine"></i>{m.wizard_my_share()}</span>
		</div>
		<label class="ui-khatm-check">
			<input type="checkbox" class="ui-checkbox" bind:checked={hideFinishedIntervals} />
			<span>{m.wizard_hide_completed()}</span>
		</label>
	</div>

	{#if visibleRanges.length > 0}
		<ul
			class="ui-khatm-range-results"
			aria-label={m.wizard_range_list({ rangeType: rangeTypeTitle })}
		>
			{#each visibleRanges as { range, percent, myLength }}
				{@const completed = percent >= 100}
				{@const partial = percent > 0 && !completed}
				{@const mine = myLength > 0}
				<li>
					<button
						class="ui-khatm-range-card"
						class:ui-khatm-range-card-partial={partial}
						class:ui-khatm-range-card-mine={mine}
						type="button"
						disabled={completed}
						onclick={() => select(range, percent)}
					>
						<span class="ui-khatm-range-card-main">
							<strong>{range.title || range.getTitleSurahOrinted()}</strong>
							<span class="ui-khatm-range-card-status">
								{#if mine}
									<span class="ui-badge ui-badge-accent ui-badge-xs">
										{myLength === range.length ? m.wizard_my_share() : m.wizard_includes_my_share()}
									</span>
								{/if}
								{#if partial}
									<span class="ui-badge ui-badge-info ui-badge-xs">{m.wizard_partial_free()}</span>
								{:else if completed}
									<span class="ui-badge ui-badge-neutral ui-badge-xs">{m.wizard_completed()}</span>
								{:else}
									<span class="ui-badge ui-badge-success ui-badge-xs">{m.wizard_fully_free()}</span>
								{/if}
							</span>
						</span>
						{#if partial}
							<span class="ui-khatm-range-card-progress">
								<span>{m.wizard_selected_percent({ percent: formatPercent(percent) })}</span>
								<progress
									class="ui-progress"
									max={100}
									value={percent}
									aria-label={m.wizard_selected_percent({
										percent: percent.toLocaleString(localeTag()),
									})}
								></progress>
							</span>
						{/if}
						<span class="ui-khatm-range-card-action">
							{completed
								? m.wizard_no_free_share()
								: partial
									? m.wizard_view_free_parts()
									: m.wizard_select_share()}
							{#if !completed}<IconArrow aria-hidden="true" class="ltr:mirror" />{/if}
						</span>
					</button>
				</li>
			{/each}
		</ul>

		{#if visibleRanges.length < filteredRanges.length}
			<div class="ui-khatm-range-more">
				<p>
					{m.wizard_showing_items({
						visible: visibleRanges.length.toLocaleString(localeTag()),
						total: filteredRanges.length.toLocaleString(localeTag()),
					})}
				</p>
				<button
					type="button"
					class="ui-btn ui-btn-outline"
					onclick={() => (visibleRangeLimit += 30)}
				>
					{m.wizard_show_more()}
				</button>
			</div>
		{/if}
	{:else}
		<div class="ui-khatm-empty ui-khatm-wizard-empty">
			<IconSearch aria-hidden="true" />
			<h3>
				{rangeQuery ? m.wizard_no_search_result() : m.wizard_no_free_range()}
			</h3>
			<p>
				{rangeQuery ? m.wizard_try_another_search() : m.wizard_choose_another_size()}
			</p>
			{#if rangeQuery}
				<button type="button" class="ui-btn ui-btn-soft" onclick={() => (rangeQuery = '')}
					>{m.wizard_clear_search()}</button
				>
			{:else if khatm.rangeType === 'free'}
				<button type="button" class="ui-btn ui-btn-primary" onclick={() => goToStep(1)}
					>{m.wizard_choose_other_size()}</button
				>
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet stepShowResult(selectedRange: QuranRange)}
	<div class="ui-khatm-wizard-success" role="status" aria-live="polite">
		<span class="ui-khatm-wizard-success-icon"><IconCheck /></span>
		<span class="ui-khatm-wizard-kicker">{m.wizard_selection_success()}</span>
		<h2>{m.wizard_share_reserved()}</h2>
		<p class="ui-khatm-wizard-success-copy">
			{m.wizard_share_success_description()}
		</p>
		<div class="ui-khatm-wizard-success-range">
			<IconBook aria-hidden="true" />
			<div><span>{m.wizard_my_share()}</span><strong>{selectedRange.getTitle()}</strong></div>
		</div>
		<a href={selectedRange.getLink(khatm)} class="ui-btn ui-btn-primary ui-btn-lg ui-btn-block">
			<IconBook />
			{m.wizard_view_read_ayahs()}
		</a>
		<button type="button" class="ui-btn ui-btn-ghost" onclick={() => goToStep(1)}
			>{m.wizard_choose_another_share()}</button
		>
	</div>
{/snippet}

<section class="ui-khatm-wizard" aria-labelledby="wizard-title">
	<h2 id="wizard-title" class="ui-sr-only">{m.wizard_title()}</h2>
	<nav class="ui-khatm-wizard-progress" aria-label={m.wizard_steps()}>
		<ol>
			{#if khatm.rangeType === 'free'}
				<li class:ui-khatm-wizard-step-active={step >= 1}>
					{#if step > 1}
						<button type="button" onclick={() => goToStep(1)}>
							<span>۱</span><b>{m.wizard_share_size()}</b>
						</button>
					{:else}
						<span aria-current="step"><i>۱</i><b>{m.wizard_share_size()}</b></span>
					{/if}
				</li>
			{/if}
			<li class:ui-khatm-wizard-step-active={step >= (khatm.rangeType === 'free' ? 2 : 1)}>
				<span aria-current={step === (khatm.rangeType === 'free' ? 2 : 1) ? 'step' : undefined}>
					<i>{khatm.rangeType === 'free' ? '۲' : '۱'}</i><b>{m.wizard_choose_range()}</b>
				</span>
			</li>
			<li class:ui-khatm-wizard-step-active={step >= (khatm.rangeType === 'free' ? 3 : 2)}>
				<span aria-current={step === (khatm.rangeType === 'free' ? 3 : 2) ? 'step' : undefined}>
					<i>{khatm.rangeType === 'free' ? '۳' : '۲'}</i><b>{m.wizard_start_reading()}</b>
				</span>
			</li>
		</ol>
	</nav>

	<div class="ui-khatm-wizard-body">
		{#if khatm.rangeType === 'free'}
			{#if step === 1}{@render stepSelectRangeType()}{/if}
			{#if step === 2}{@render stepSelectRange()}{/if}
			{#if step === 3 && selected}{@render stepShowResult(selected)}{/if}
		{:else}
			{#if step === 1}{@render stepSelectRange()}{/if}
			{#if step === 2 && selected}{@render stepShowResult(selected)}{/if}
		{/if}
	</div>
</section>

<Modal bind:open={() => modal, toggleModal} contentClass="ui-khatm-wizard-dialog">
	{#if selectionMode === 'subrange' && selected}
		<IncompleteRangePicker
			{khatm}
			{participation}
			parts={rawParts}
			range={selected}
			onClose={closeModal}
			onFinished={finishSubrange}
		/>
	{:else}
		<ConfirmRange {khatm} onClose={closeModal} onFinished={closeModalAndNext} range={selected} />
	{/if}
</Modal>
