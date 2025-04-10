<script lang="ts">
	import Modal from '$lib/components/Modal.svelte'
	import { Ayah, HizbQuarter, Juz, Page, Surah } from '@ghoran/entity'
	import { findNonOverlappingSubranges } from '$lib/utility/findNonOverlappingSubranges'
	import { juz_toRange } from '$lib/entity/Juz'
	import { surah_getName, surah_toRange } from '$lib/entity/Surah'
	import { page_toRange } from '$lib/entity/Page'
	import { QuranRange } from '$lib/entity/Range'
	import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
	import { hizbQuarter_toRange } from '$lib/entity/HizbQuarter'
	import ConfirmRange from '../confirm-range.svelte'
	import { useKathmContext } from '../../khatm-context.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { page } from '$app/state'
	import { pushState } from '$app/navigation'

	type PageState = {
		modal?: boolean
	}

	const khatmContext = useKathmContext()
	const khatm = $derived(khatmContext.khatm)
	const parts = $derived(khatmContext.parts)

	let showBadges = $state(false)
	let hideFinishedIntervals = $state(false)
	/** نوع زیربازه‌ها در چیدمان آکاردئونی */
	let subrangeType = $state<'hizbQuarter' | 'surah' | 'page'>('surah')

	const juzList = Juz.getAll()
	const hizbQuarterList = HizbQuarter.getAll()
	const surahList = Surah.getAll()
	const pageList = Page.getAll()

	const juzRanges = juzList.map(juz_toRange)
	const hizbQuarterRanges = hizbQuarterList.map(hizbQuarter_toRange)
	const surahRanges = surahList.map(surah_toRange)
	const pageRanges = pageList.map(page_toRange)

	const selectableJuzParts = $derived(findNonOverlappingSubranges(parts, juzRanges))
	const selectableHizbQuarterParts = $derived(findNonOverlappingSubranges(parts, hizbQuarterRanges))
	const selectableSurahParts = $derived(findNonOverlappingSubranges(parts, surahRanges))
	const selectablePageParts = $derived(findNonOverlappingSubranges(parts, pageRanges))

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
				parts: item.range.divideByKahtmParts(parts),
			})) || []

		if (hideFinishedIntervals) {
			list.forEach((item) => {
				item.parts = item.parts.filter((p) => !p.khatmPart)
			})

			list = list.filter(({ parts }) => parts.length > 0)
		}
		return list
	})

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

	function openModal(start: number, end: number) {
		const range = new QuranRange(start, end)

		// if (!range.matchRangeType(khatm.rangeType)) {
		// 	toast('error', `ختم جاری ${khatm.rangeTypeTitle} است و با این بازه هم‌خوانی ندارد.`)
		// 	return
		// }

		pushState('', { modal: true } satisfies PageState)
		selected = range
	}

	function closeModal() {
		if (modal) history.back()
	}
</script>

<div class="px-4">
	<label class="my-2 block">
		<input type="checkbox" class="checkbox" bind:checked={hideFinishedIntervals} />
		پنهان کردن بازه‌های قرائت شده
	</label>

	<label class="my-2 block">
		<input type="checkbox" class="checkbox" bind:checked={showBadges} />
		نمایش ابتدا و انتهای بازه ها
	</label>
</div>

<div class="alert alert-info my-2">
	برای قبول کردن و خواندن بخشی از ختم روی بازه مورد نظر کلیک کنید.
</div>

<div
	class="rounded-box relative grid overflow-hidden border border-gray-500 text-xs"
	style:grid-template-rows={gridTemplateRows}
>
	{#snippet renderSelectableRanges(ranges: { start: number; end: number }[], column: number)}
		{#each ranges as range (range.start + ':' + range.end)}
			{@const start = Ayah.get(range.start)}
			{@const end = Ayah.get(range.end - 1)}
			<button
				class="bg-base-100 hover:bg-base-200 dark:hover:bg-base-300 col-start-1 flex min-h-4 w-full cursor-pointer flex-col items-end justify-between"
				style:grid-column-start={column}
				style:grid-row-start={range.start + 1}
				style:grid-row-end={range.end + 1}
				style:min-height={hideFinishedIntervals ? '0' : null}
				onclick={() => openModal(range.start, range.end)}
			>
				{#if showBadges}
					<span class="badge badge-xs badge-neutral rounded-l-none rounded-t-none">
						{start.number}
						{surah_getName(start.surah)}
					</span>
					<span class="badge badge-xs badge-neutral rounded-b-none rounded-l-none">
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
				class="dark:border-neutral pointer-events-none min-h-4 overflow-hidden border border-gray-300 p-1"
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
		{#each parts as part (part.plain.id)}
			<div
				class="hatched col-span-3 col-start-1 flex min-h-4 w-full items-center justify-center border-y border-dashed border-gray-500 bg-gray-100 opacity-75 dark:bg-gray-900"
				style:grid-row-start={part.start + 1}
				style:grid-row-end={part.end + 1}
			>
				<span class="select-none">قرائت شده</span>
			</div>
		{/each}
	{/if}

	{@render renderRanges(juzRanges, 1)}
	{@render renderRanges(surahRanges, 2)}
	{@render renderRanges(pageRanges, 3)}
</div>

<Modal bind:open={() => modal, closeModal}>
	<ConfirmRange {khatm} onClose={closeModal} onFinished={closeModal} range={selected} />
</Modal>
