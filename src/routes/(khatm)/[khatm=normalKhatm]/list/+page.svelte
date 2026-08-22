<script lang="ts">
	import { formatPercent, localeTag } from '$lib/i18n/format'
	/* eslint-disable svelte/no-unused-svelte-ignore */
	import Modal from '$lib/components/Modal.svelte'
	import { Juz } from '@ghoran/entity'
	import { juz_toRange } from '$lib/entity/Juz'
	import { QuranRange } from '$lib/entity/Range'
	import IconEye from '~icons/ic/outline-remove-red-eye'
	import IconList from '~icons/ic/round-format-list-bulleted'
	import IconSearch from '~icons/ic/round-search'
	import IconExpand from '~icons/ic/round-expand-more'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconRadio from '~icons/ic/round-radio-button-unchecked'
	import IconPerson from '~icons/ic/round-person'
	import IconTune from '~icons/ic/round-tune'
	import ConfirmRange from '../confirm-range.svelte'
	import { useKathmContext } from '../../khatm-context.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { page } from '$app/state'
	import { pushState } from '$app/navigation'
	import Tab from '$lib/components/Tab.svelte'
	import Accardeon from '$lib/components/Accardeon.svelte'
	import PickedRangeResult from '../PickedRangeResult.svelte'
	import RangeTypeIcon from '$lib/components/RangeTypeIcon.svelte'
	import * as m from '$lib/paraglide/messages.js'

	type PageState = {
		modal?: boolean
	}
	type SubrangeType = 'hizbQuarter' | 'surah' | 'page'

	const khatmContext = useKathmContext()
	const khatm = $derived(khatmContext.khatm)
	const parts = $derived(khatmContext.parts)
	const rawParts = $derived(khatmContext.rawParts)
	const participation = $derived(khatm.participation)

	let hideFinishedIntervals = $state(true)
	let juzQuery = $state('')
	const { rangeType: initialRangeType } = /* svelte-ignore state_referenced_locally */ khatm
	const initialSubrangeType =
		initialRangeType === 'hizbQuarter' ||
		initialRangeType === 'page' ||
		initialRangeType === 'surah'
			? initialRangeType
			: 'surah'
	let subrangeType = $state<SubrangeType>(initialSubrangeType)

	const juzRanges = Juz.getAll().map(juz_toRange)
	const availableJuzCount = $derived(
		juzRanges.filter((range) => range.getFillPercent(parts) < 100).length,
	)
	const myJuzCount = $derived(
		juzRanges.filter((range) => participation.getOverlapLength(range) > 0).length,
	)

	function normalizeQuery(value: string) {
		return value
			.trim()
			.toLocaleLowerCase(localeTag())
			.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
			.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
			.replace(/ي/g, 'ی')
			.replace(/ك/g, 'ک')
	}

	const visibleJuzRanges = $derived.by(() => {
		const query = normalizeQuery(juzQuery)
		return juzRanges.filter((range) => {
			if (hideFinishedIntervals && range.getFillPercent(parts) >= 100) return false
			if (!query) return true
			return normalizeQuery(range.title).includes(query)
		})
	})

	let openedAccardeon = $state(-1)
	const accardeonRange = $derived(visibleJuzRanges[openedAccardeon])
	const accardeonSubranges = $derived(
		{
			surah: accardeonRange?.getSurahs.bind(accardeonRange),
			page: accardeonRange?.getPages.bind(accardeonRange),
			hizbQuarter: accardeonRange?.getHizbQuarters.bind(accardeonRange),
		}[subrangeType]?.(),
	)
	const accardeonDevidedRanges = $derived.by(() => {
		let list =
			accardeonSubranges?.map((item) => ({
				...item,
				parts: item.range.divideByKahtmParts(rawParts),
			})) || []

		if (hideFinishedIntervals) {
			list.forEach((item) => {
				item.parts = item.parts.filter((part) => !part.khatmPart)
			})
			list = list.filter(({ parts: dividedParts }) => dividedParts.length > 0)
		}
		return list
	})

	const modal = $derived(!!(page.state as PageState).modal)
	let selected = $state(new QuranRange(0, 0))
	let picked = $state(false)

	function resetOpenedJuz() {
		openedAccardeon = -1
	}

	function clearSearch() {
		juzQuery = ''
		resetOpenedJuz()
	}

	function openModal(range: QuranRange) {
		if (modal) return

		if (!range.matchRangeType(khatm.rangeType)) {
			toast(
				'error',
				m.list_unavailable_range({ rangeType: khatm.rangeTypeTitle }),
			)
			return
		}
		selected = range
		picked = false
		pushState('', { modal: true } satisfies PageState)
	}

	function closeModal() {
		if (modal) history.back()
	}
</script>

<section class="ui-khatm-browser" aria-labelledby="khatm-list-title">
	<header class="ui-khatm-browser-hero">
		<div class="ui-khatm-browser-heading">
			<span class="ui-khatm-browser-heading-icon"><IconList /></span>
			<div>
				<span class="ui-khatm-wizard-kicker">{m.list_eyebrow()}</span>
				<h2 id="khatm-list-title">{m.list_title()}</h2>
				<p>
					{m.list_description()}
				</p>
			</div>
		</div>

		<div class="ui-khatm-browser-stats" aria-label={m.list_summary()}>
			<div><strong>{formatPercent(khatm.percent)}</strong><span>{m.list_progress()}</span></div>
			<div>
				<strong>{availableJuzCount.toLocaleString(localeTag())}</strong><span>{m.list_available_juz()}</span>
			</div>
			<div><strong>{myJuzCount.toLocaleString(localeTag())}</strong><span>{m.list_my_juz()}</span></div>
		</div>
	</header>

	<div class="ui-khatm-browser-controls">
		<div class="ui-khatm-browser-search">
			<label for="juz-search">{m.list_go_to_juz()}</label>
			<div>
				<IconSearch aria-hidden="true" />
				<input
					id="juz-search"
					class="ui-input"
					type="search"
					placeholder={m.list_search_placeholder()}
					bind:value={juzQuery}
					oninput={resetOpenedJuz}
				/>
				{#if juzQuery}
					<button type="button" class="ui-btn ui-btn-ghost ui-btn-xs" onclick={clearSearch}
						>{m.wizard_clear_search()}</button
					>
				{/if}
			</div>
		</div>
		<label class="ui-khatm-browser-filter">
			<span class="ui-khatm-browser-filter-icon"><IconTune /></span>
			<span><strong>{m.list_capacity_only()}</strong><small>{m.list_hide_completed()}</small></span>
			<input
				type="checkbox"
				class="ui-checkbox"
				bind:checked={hideFinishedIntervals}
				onchange={resetOpenedJuz}
			/>
		</label>
	</div>

	<div class="ui-khatm-browser-legend" aria-label={m.list_legend()}>
		<span><i class="ui-khatm-browser-key ui-khatm-browser-key-free"></i>{m.list_free_selectable()}</span>
		<span><i class="ui-khatm-browser-key ui-khatm-browser-key-picked"></i>{m.list_picked()}</span>
		<span><i class="ui-khatm-browser-key ui-khatm-browser-key-mine"></i>{m.wizard_my_share()}</span>
	</div>

	{#if visibleJuzRanges.length > 0}
		<div class="ui-khatm-browser-accordion">
			<Accardeon items={visibleJuzRanges} bind:selectedIndex={openedAccardeon}>
				{#snippet title(range, index, expanded)}
					{@const percent = range.getFillPercent(parts)}
					{@const juzNumber = juzRanges.indexOf(range) + 1}
					{@const mine = participation.getOverlapLength(range) > 0}
					<div
						class="ui-khatm-browser-juz"
						data-range-index={index}
						class:ui-khatm-browser-juz-open={expanded}
						class:ui-khatm-browser-juz-finished={percent >= 100}
					>
						<span class="ui-khatm-browser-juz-number">{juzNumber.toLocaleString(localeTag())}</span>
						<span class="ui-khatm-browser-juz-main">
							<span class="ui-khatm-browser-juz-title">
								<strong>{range.title}</strong>
								{#if mine}<span class="ui-badge ui-badge-accent ui-badge-xs">{m.wizard_includes_my_share()}</span
									>{/if}
								{#if percent >= 100}<span class="ui-badge ui-badge-neutral ui-badge-xs"
										>{m.wizard_completed()}</span
									>{/if}
							</span>
							<span class="ui-khatm-browser-juz-progress">
								<progress
									class="ui-progress"
									max={100}
									value={percent}
									aria-label={m.khatm_progress_range({ range: range.title })}
								></progress>
								<small>{m.wizard_selected_percent({ percent: formatPercent(percent) })}</small>
							</span>
						</span>
						<span class="ui-khatm-browser-juz-action">
							<span>
								{expanded ? m.list_close_details() : percent >= 100 ? m.list_view_details() : m.list_view_parts()}
							</span>
							<IconExpand aria-hidden="true" />
						</span>
					</div>
				{/snippet}

				{#snippet content(range)}
					{@const juzPercent = range.getFillPercent(parts)}
					<div class="ui-khatm-browser-content">
						<div class="ui-khatm-browser-content-head">
							<div>
								<span>{m.list_details({ title: range.title })}</span>
								<strong>
									{juzPercent >= 100
										? m.list_all_picked()
										: m.list_green_free()}
								</strong>
							</div>
							{#if juzPercent === 0 && range.matchRangeType(khatm.rangeType)}
								<button
									type="button"
									class="ui-btn ui-btn-primary ui-btn-sm"
									onclick={() => openModal(range)}
								>
									{m.list_select_all({ title: range.title })}
								</button>
							{/if}
						</div>

						<div class="ui-khatm-browser-view-control">
							<div>
								<RangeTypeIcon type={subrangeType} />
								<span>
									<strong>{m.list_divide_parts()}</strong>
									<small>{m.list_choose_view()}</small>
								</span>
							</div>
							<div class="ui-khatm-browser-tabs">
								<Tab
									tabs={[
										{ title: m.wizard_range_hizb(), slug: 'hizbQuarter' },
										{ title: m.wizard_range_page(), slug: 'page' },
										{ title: m.wizard_range_surah(), slug: 'surah' },
									]}
									bind:value={subrangeType}
								/>
							</div>
						</div>

						{#if accardeonDevidedRanges.length > 0}
							<ul class="ui-khatm-browser-groups">
								{#each accardeonDevidedRanges as { parts: dividedParts, range: subrange }}
									{@const percent = subrange.getFillPercent(parts)}
									<li class="ui-khatm-browser-group">
										<header>
											<div>
												<strong>{subrange.title}</strong>
										<span>{m.wizard_selected_percent({ percent: formatPercent(percent) })}</span>
											</div>
											<progress
												class="ui-progress"
												max={100}
												value={percent}
										aria-label={m.khatm_progress_range({ range: subrange.title })}
											></progress>
										</header>
										<ul class="ui-khatm-browser-parts">
											{#each dividedParts as { khatmPart, range: part }}
												{@const mine = !!khatmPart && participation.isMine(part)}
												{@const canSelect = !khatmPart && part.matchRangeType(khatm.rangeType)}
												<li
													class:ui-khatm-browser-part-free={canSelect}
													class:ui-khatm-browser-part-view={!khatmPart && !canSelect}
													class:ui-khatm-browser-part-picked={!!khatmPart && !mine}
													class:ui-khatm-browser-part-mine={mine}
												>
													<span class="ui-khatm-browser-part-state">
														{#if mine}<IconPerson />{:else if khatmPart}<IconCheck
															/>{:else}<IconRadio />{/if}
													</span>
													<div class="ui-khatm-browser-part-copy">
														<strong>{part.getTitleSurahOrinted()}</strong>
														<span>
															{mine
											? m.list_this_share()
											: khatmPart
												? m.list_picked_before()
												: canSelect
													? m.list_ready()
													: m.list_range_type_only({ rangeType: khatm.rangeTypeTitle })}
														</span>
													</div>
													<div class="ui-khatm-browser-part-actions">
														{#if canSelect}
															<button
																type="button"
																class="ui-btn ui-btn-primary ui-btn-sm"
																onclick={() => openModal(part)}
															>
										{m.list_select_part()}
															</button>
														{/if}
														<a
															class="ui-btn ui-btn-icon ui-btn-ghost ui-btn-sm"
										aria-label={`${m.common_view()} ${part.getTitleSurahOrinted()}`}
															target="_blank"
															rel="noreferrer"
															href={part.getLink(khatm)}><IconEye /></a
														>
													</div>
												</li>
											{/each}
										</ul>
									</li>
								{/each}
							</ul>
						{:else}
							<div class="ui-khatm-browser-empty">
								<IconCheck />
								<strong>{m.list_no_free_parts()}</strong>
								<span>{m.list_disable_filter()}</span>
							</div>
						{/if}
					</div>
				{/snippet}
			</Accardeon>
		</div>
	{:else}
		<div class="ui-khatm-browser-empty ui-khatm-browser-empty-page">
			<IconSearch />
			<strong>{juzQuery ? m.list_no_juz() : m.list_all_completed()}</strong>
			<span
				>{juzQuery
					? m.list_search_another_number()
					: m.list_disable_capacity_filter()}</span
			>
			{#if juzQuery}<button type="button" class="ui-btn ui-btn-soft" onclick={clearSearch}
					>{m.wizard_clear_search()}</button
				>{/if}
		</div>
	{/if}
</section>

<Modal bind:open={() => modal, closeModal} contentClass="ui-khatm-wizard-dialog">
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
