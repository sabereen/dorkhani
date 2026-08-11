<script lang="ts">
	import Modal from '$lib/components/Modal.svelte'
	import { Juz } from '@ghoran/entity'
	import { juz_toRange } from '$lib/entity/Juz'
	import { QuranRange } from '$lib/entity/Range'
	import IconEye from '~icons/ic/outline-remove-red-eye'
	import ConfirmRange from '../confirm-range.svelte'
	import { useKathmContext } from '../../khatm-context.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { page } from '$app/state'
	import { pushState } from '$app/navigation'
	import Tab from '$lib/components/Tab.svelte'
	import Accardeon from '$lib/components/Accardeon.svelte'
	import IconList from '~icons/ic/round-format-list-bulleted'
	import PickedRangeResult from '../PickedRangeResult.svelte'

	type PageState = {
		modal?: boolean
	}

	const khatmContext = useKathmContext()
	const khatm = $derived(khatmContext.khatm)
	const parts = $derived(khatmContext.parts)
	const rawParts = $derived(khatmContext.rawParts)
	const participation = $derived(khatm.participation)

	let hideFinishedIntervals = $state(false)
	/** نوع زیربازه‌ها در چیدمان آکاردئونی */
	let subrangeType = $state<'hizbQuarter' | 'surah' | 'page'>('surah')

	const juzList = Juz.getAll()
	const juzRanges = juzList.map(juz_toRange)

	let openedAccardeon = $state(-1)
	let accardeonJuz = $derived(juzList[openedAccardeon] as Juz | undefined)
	let accardeonRange = $derived(accardeonJuz && juz_toRange(accardeonJuz))
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
				item.parts = item.parts.filter((p) => !p.khatmPart)
			})

			list = list.filter(({ parts }) => parts.length > 0)
		}
		return list
	})

	const modal = $derived(!!(page.state as PageState).modal)

	let selected = $state(new QuranRange(0, 0))
	let picked = $state(false)

	function openModal(range: QuranRange) {
		if (modal) return

		if (!range.matchRangeType(khatm.rangeType)) {
			toast('error', `ختم جاری ${khatm.rangeTypeTitle} است و با این بازه هم‌خوانی ندارد.`)
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

<section class="ui-khatm-panel">
	<div class="ui-khatm-panel-header">
		<span class="ui-khatm-option-icon"><IconList /></span>
		<h2>انتخاب دقیق از فهرست قرآن</h2>
		<p>یک جزء را باز کنید و سهم مناسب را بر اساس سوره، صفحه یا ربع حزب بردارید.</p>
	</div>
	<div class="ui-khatm-toolbar">
		<label class="ui-khatm-check">
			<input type="checkbox" class="ui-checkbox" bind:checked={hideFinishedIntervals} />
			<span>فقط بازه‌های آزاد</span>
		</label>
	</div>
	<div class="ui-khatm-accordion">
		<Accardeon items={juzRanges} bind:selectedIndex={openedAccardeon}>
			{#snippet title(range)}
				{@const percent = range.getFillPercent(parts)}
				<div class="ui-khatm-accordion-title" class:opacity-50={percent >= 100}>
					<span class="ui-radial-progress" style:--value={percent} style:--size="1.4rem" aria-valuenow={percent} role="progressbar">
						&lrm;{percent.toLocaleString('fa')}٪&lrm;
					</span>
					<strong>{range.title}</strong>
					{#if percent >= 100}<span class="ui-badge ui-badge-success ui-badge-xs">تکمیل شده</span>{/if}
					<span class="ui-khatm-option-arrow" aria-hidden="true">⌄</span>
				</div>
			{/snippet}

			{#snippet content(range, i)}
				<div class="ui-khatm-accordion-content">
					<div class="ui-khatm-subranges">
						<div class="ui-khatm-subrange-tabs">
							<Tab
								tabs={[
									{ title: 'ربع حزب', slug: 'hizbQuarter' },
									{ title: 'صفحه', slug: 'page' },
									{ title: 'سوره', slug: 'surah' },
								]}
								bind:value={subrangeType}
							/>
						</div>
						<ul class="ui-khatm-subrange-list">
							{#each accardeonDevidedRanges as { parts, range }}
								{@const percent = range.getFillPercent(khatmContext.parts)}
								<li class="ui-khatm-subrange-row">
									<div class="ui-khatm-subrange-label">
										<span class="ui-radial-progress" style:--value={percent} style:--size="1.4rem" aria-valuenow={percent} role="progressbar">
											&lrm;{percent.toLocaleString('fa')}٪&lrm;
										</span>
										<strong>{range.title}</strong>
									</div>
									<div class="ui-khatm-subrange-parts">
										{#each parts as { khatmPart, range }}
											{@const mine = !!khatmPart && participation.isMine(range)}
											<div
												class="ui-khatm-subrange-part"
												class:ui-khatm-subrange-part-mine={mine}
											>
												<span class:ui-text-muted={!!khatmPart && !mine}>{range.getTitleSurahOrinted()}</span>
												{#if khatmPart}
													{#if mine}
														<span class="ui-badge ui-badge-accent ui-badge-xs">سهم شما</span>
													{:else}
														<span class="ui-badge ui-badge-success ui-badge-xs">خوانده‌شده</span>
													{/if}
												{:else}
													<button type="button" class="ui-btn ui-btn-primary ui-btn-xs" disabled={!range.matchRangeType(khatm.rangeType)} onclick={() => openModal(range)}>انتخاب</button>
												{/if}
												<a class="ui-btn ui-btn-icon ui-btn-ghost ui-btn-xs" aria-label={`مشاهده ${range.getTitleSurahOrinted()}`} target="_blank" href={range.getLink(khatm)}><IconEye /></a>
											</div>
										{/each}
									</div>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			{/snippet}
		</Accardeon>
	</div>
</section>

<Modal bind:open={() => modal, closeModal}>
	{#if picked}
		<PickedRangeResult {khatm} onClose={closeModal} range={selected} />
	{:else}
		<ConfirmRange {khatm} onClose={closeModal} onFinished={() => (picked = true)} range={selected} />
	{/if}
</Modal>
