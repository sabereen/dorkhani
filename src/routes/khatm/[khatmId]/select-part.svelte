<script lang="ts" module>
	import { KhatmPart } from '$lib/entity/KhatmPart'

	export type Props = {
		parts: KhatmPart[]
		grid?: boolean
		onFinished?: () => void
	}
</script>

<script lang="ts">
	import Modal from '$lib/components/Modal.svelte'
	import { Ayah, Juz, Page, Surah } from '@ghoran/entity'
	import { findNonOverlappingSubranges } from '$lib/utility/findNonOverlappingSubranges'
	import { juz_toRange } from '$lib/entity/Juz'
	import { surah_getName, surah_toRange } from '$lib/entity/Surah'
	import { page_toRange } from '$lib/entity/Page'
	import { QuranRange } from '$lib/entity/Range'
	import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
	import IconEye from '~icons/ic/outline-remove-red-eye'
	import ConfirmRange from './confirm-range.svelte'

	const props: Props = $props()

	let showBadges = $state(false)
	const gridLayout = $derived(props.grid)
	let hideFinishedIntervals = $state(false)
	/** نوع زیربازه‌ها در چیدمان آکاردئونی */
	let subrangeType = $state<'surah' | 'page'>('surah')

	const juzList = Juz.getAll()
	const surahList = Surah.getAll()
	const pageList = Page.getAll()

	const juzRanges = juzList.map(juz_toRange)
	const surahRanges = surahList.map(surah_toRange)
	const pageRanges = pageList.map(page_toRange)

	const selectableJuzParts = $derived(findNonOverlappingSubranges(props.parts, juzRanges))
	const selectableSurahParts = $derived(findNonOverlappingSubranges(props.parts, surahRanges))
	const selectablePageParts = $derived(findNonOverlappingSubranges(props.parts, pageRanges))

	let openedAccardeon = $state(-1)
	let accardeonJuz = $derived(juzList[openedAccardeon] as Juz | undefined)
	let accardeonRange = $derived(accardeonJuz && juz_toRange(accardeonJuz))
	const accardeonSubranges = $derived(
		subrangeType === 'surah' ? accardeonRange?.getSurahs() : accardeonRange?.getPages(),
	)
	const accardeonDevidedRanges = $derived.by(() => {
		let list =
			accardeonSubranges?.map((item) => ({
				...item,
				parts: item.range.divideByKahtmParts(props.parts),
			})) || []

		if (hideFinishedIntervals) {
			list.forEach((item) => {
				item.parts = item.parts.filter((p) => !p.khatmPart)
			})

			list = list.filter(({ parts }) => parts.length > 0)
		}
		return list
	})

	$effect(() => {
		console.log('selectable pages', selectablePageParts)
	})
	$effect(() => {
		console.log('selectable surahs', selectableSurahParts)
	})
	$effect(() => {
		console.log('selectable juz', selectableJuzParts)
	})
	$effect(() => {
		console.log('parts', props.parts)
	})

	const gridTemplateRows = $derived.by(() => {
		if (!hideFinishedIntervals || props.parts.length === 0) return null

		let rows: string[] = []
		let currentPartIndex = 0
		for (let i = 0; i < COUNT_OF_AYAHS; i++) {
			let currentPart = props.parts[currentPartIndex]
			if (currentPart.end === i) {
				currentPartIndex++
				currentPart = props.parts[currentPartIndex]
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

	let modal = $state(false)

	let selected = $state(new QuranRange(0, 0))

	function openModal(start: number, end: number) {
		modal = true
		selected = new QuranRange(start, end)
	}
</script>

<div class="px-4">
	<label class="my-2 block">
		<input type="checkbox" class="checkbox" bind:checked={hideFinishedIntervals} />
		پنهان کردن بازه‌های قرائت شده
	</label>

	{#if gridLayout}
		<label class="my-2 block">
			<input type="checkbox" class="checkbox" bind:checked={showBadges} />
			نمایش ابتدا و انتهای بازه ها
		</label>
	{/if}
</div>

{#if gridLayout}
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
						<span class="badge badge-xs badge-neutral rounded-t-none rounded-l-none">
							{start.number}
							{surah_getName(start.surah)}
						</span>
						<span class="badge badge-xs badge-neutral rounded-l-none rounded-b-none">
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
			{#each props.parts as part (part.plain.id)}
				<div
					class="hatched col-span-3 col-start-1 flex min-h-4 w-full items-center justify-center border-y border-dashed border-gray-500 bg-gray-100 opacity-75"
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
{:else}
	<div class="join join-vertical bg-base-100 w-full">
		{#each juzRanges as range, i}
			{@const percent = range.getFillPercent(props.parts)}
			<div
				class="collapse-plus join-item bg-base-100 collapse border border-gray-500"
				class:hidden={hideFinishedIntervals && percent >= 100}
				class:opacity-50={percent >= 100}
				class:pointer-events-none={percent >= 100}
			>
				<input
					type="radio"
					name="juz"
					bind:group={openedAccardeon}
					value={i}
					disabled={percent >= 100}
				/>
				<div class="collapse-title font-semibold">
					<span
						class="radial-progress text-primary ms-1 text-[0.5rem]"
						style:--value={percent}
						style:--size="1.4rem"
						aria-valuenow={percent}
						role="progressbar"
					>
						&lrm;{percent}%&lrm;
					</span>
					{range.title}
					{#if percent >= 100}
						<span class="badge badge-xs">قبلا قرائت شده است</span>
					{/if}
				</div>
				<div class="collapse-content w-full text-xs sm:text-sm">
					{#if openedAccardeon === i}
						<!-- انتخاب نوع زیربازه -->
						<div class="tabs tabs-box justify-center">
							<input
								class="tab"
								type="radio"
								name="subrangeType"
								bind:group={subrangeType}
								value="surah"
								aria-label="سوره"
							/>
							<div class="tab-content">
								{#if subrangeType === 'surah'}
									{@render tabContent()}
								{/if}
							</div>
							<input
								class="tab"
								type="radio"
								name="subrangeType"
								bind:group={subrangeType}
								value="page"
								aria-label="صفحه"
							/>
							<div class="tab-content">
								{#if subrangeType === 'page'}
									{@render tabContent()}
								{/if}
							</div>
						</div>

						{#snippet tabContent()}
							<ul class="rounded-box py-2">
								{#each accardeonDevidedRanges as { parts, range }}
									{@const percent = range.getFillPercent(props.parts)}
									<li
										class="bg-base-100 flex items-center border border-gray-200 px-1 py-1 first:rounded-t last:rounded-b dark:border-gray-700"
									>
										<div class="ml-2 flex w-24 items-center">
											<span
												class="radial-progress text-primary ms-1 me-1 text-[0.4rem]"
												style:--value={percent}
												style:--size="1.4rem"
												aria-valuenow={percent}
												role="progressbar"
											>
												&lrm;{percent}%&lrm;
											</span>
											{range.title}
										</div>
										<div class="flex grow flex-col">
											{#each parts as { khatmPart, range }}
												<div class="flex items-center px-1 py-1">
													<span class:text-gray-500={!!khatmPart}>
														{range.getTitleSurahOrinted()}
													</span>
													<span class="m-3 h-0 grow border border-dashed border-gray-500/20"></span>
													{#if khatmPart}
														<span class="badge badge-success badge-xs">قرائت‌شده</span>
													{:else}
														<button
															class="btn btn-primary btn-xs ms-auto"
															onclick={() => openModal(range.start, range.end)}
														>
															انتخاب
														</button>
													{/if}
													<a
														class="btn btn-circle btn-ghost btn-xs ms-1"
														target="_blank"
														href={'https://ketabmobin.com/ayah/' + range.start}
													>
														<IconEye />
													</a>
												</div>
											{/each}
										</div>
									</li>
								{/each}
							</ul>
						{/snippet}
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

<Modal bind:open={modal}>
	<ConfirmRange onClose={() => (modal = false)} range={selected} />
</Modal>
