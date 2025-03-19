<script lang="ts" module>
	import { KhatmPart } from '$lib/entity/KhatmPart'

	export type Props = {
		parts: KhatmPart[]
		onFinished?: () => void
	}
</script>

<script lang="ts">
	import Modal from '$lib/components/Modal.svelte'
	import { Ayah, Juz, Page, Surah } from '@ghoran/entity'
	import { page } from '$app/state'
	import { findNonOverlappingSubranges } from '$lib/utility/findNonOverlappingSubranges'
	import { invalidateAll } from '$app/navigation'
	import { juz_toRange } from '$lib/entity/Juz'
	import { surah_getName, surah_toRange } from '$lib/entity/Surah'
	import { page_toRange } from '$lib/entity/Page'
	import { QuranRange } from '$lib/entity/Range'

	const props: Props = $props()

	let showBadges = $state(false)
	let gridLayout = $state(false)

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
	const accardeonSurahList = $derived(accardeonRange?.getSurahs())
	const accardeonDevidedRanges = $derived(
		accardeonSurahList?.map((item) => ({
			...item,
			parts: item.range.divideByKahtmParts(props.parts),
		})) || [],
	)

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

	let modal = $state(false)

	let selected = $state(new QuranRange(0, 0))

	function openModal(start: number, end: number) {
		modal = true
		selected = new QuranRange(start, end)
	}

	let loading = $state(false)
	/** قسمت انتخاب شده را به عنوان خوانده شده علامت می‌زند */
	async function markAsRead() {
		if (loading) return
		loading = true
		try {
			const response = await fetch(`/khatm/${page.params.khatmId}`, {
				method: 'POST',
				body: JSON.stringify({ start: selected.start, end: selected.end }),
			})
			if (response.status !== 200) throw new Error('خطا')
			await response.json()
			modal = false
			props.onFinished?.()
		} catch (err) {
			alert(err)
			invalidateAll()
		} finally {
			loading = false
		}
	}
</script>

<label class="my-2 block">
	<input type="checkbox" class="checkbox" bind:checked={gridLayout} />
	نمایش جدولی
</label>

{#if gridLayout}
	<label class="my-2 block">
		<input type="checkbox" class="checkbox" bind:checked={showBadges} />
		نمایش بازه ها
	</label>
{/if}

{#if gridLayout}
	<div class="relative grid text-xs">
		{#snippet renderSelectableRanges(ranges: { start: number; end: number }[], column: number)}
			{#each ranges as range (range.start + ':' + range.end)}
				{@const start = Ayah.get(range.start)}
				{@const end = Ayah.get(range.end - 1)}
				<button
					class="col-start-1 flex min-h-4 w-full cursor-pointer flex-col items-end justify-between bg-gray-300/75 hover:bg-gray-500/60 dark:bg-gray-500/85 dark:hover:bg-gray-400/75"
					style:grid-column-start={column}
					style:grid-row-start={range.start + 1}
					style:grid-row-end={range.end + 1}
					onclick={() => openModal(range.start, range.end)}
				>
					{#if showBadges}
						<span class="badge badge-xs badge-neutral">
							{start.number}
							{surah_getName(start.surah)}
						</span>
						<span class="badge badge-xs badge-neutral">
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
					class="pointer-events-none min-h-4 overflow-hidden border border-gray-400 p-1"
					title={range.title}
					style:grid-column-start={column}
					style:grid-row-start={range.start + 1}
					style:grid-row-end={range.end + 1}
				>
					{range.title}
				</div>
			{/each}
		{/snippet}

		{@render renderSelectableRanges(selectableJuzParts, 1)}
		{@render renderSelectableRanges(selectableSurahParts, 2)}
		{@render renderSelectableRanges(selectablePageParts, 3)}

		{#each props.parts as part (part.plain.id)}
			<div
				class="col-span-3 col-start-1 min-h-4 w-full bg-green-700/70"
				style:grid-row-start={part.start + 1}
				style:grid-row-end={part.end + 1}
			></div>
		{/each}

		{@render renderRanges(juzRanges, 1)}
		{@render renderRanges(surahRanges, 2)}
		{@render renderRanges(pageRanges, 3)}
	</div>
{:else}
	<div class="join join-vertical bg-base-100 w-full">
		{#each juzRanges as range, i}
			{@const percent = range.getFillPercent(props.parts)}
			<div class="collapse-plus join-item bg-base-100 border-base-300 collapse border">
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
				<div class="collapse-content w-full text-sm">
					<ul class="bg-base-100 rounded-box">
						{#each accardeonDevidedRanges as { surah, parts, range }}
							{@const percent = range.getFillPercent(props.parts)}
							<li
								class="my-2 flex items-center rounded border border-gray-200 px-3 py-1 shadow-md dark:border-gray-700"
							>
								<div class="ml-2 flex w-20 items-center">
									<span
										class="radial-progress text-primary ms-1 me-1 text-[0.4rem]"
										style:--value={percent}
										style:--size="1.4rem"
										aria-valuenow={percent}
										role="progressbar"
									>
										&lrm;{percent}%&lrm;
									</span>
									{surah_getName(surah)}
								</div>
								<div class="flex flex-col">
									{#each parts as { khatmPart, range }}
										<div class="px-1 py-1" class:text-gray-500={!!khatmPart}>
											{range.getTitleSurahOrinted()}
											{#if khatmPart}
												<span class="badge badge-xs">قبلا قرائت شده است</span>
											{:else}
												<button
													class="btn btn-primary btn-xs"
													onclick={() => openModal(range.start, range.end)}
												>
													انتخاب
												</button>
											{/if}
										</div>
									{/each}
								</div>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{/each}
	</div>
{/if}

<Modal bind:open={modal}>
	{#if selected}
		آیا قرائت این بازه را تقبل می‌کنید؟
		<p class="my-2 text-sm">
			{selected.getTitle()}
			<a
				href={`https://ketabmobin.com/ayah/${selected.start}`}
				target="_blank"
				class="badge badge-info badge-outline"
			>
				مشاهده آیات
			</a>
		</p>

		<div>
			<button class="btn btn-primary mt-2" disabled={loading} onclick={markAsRead}>می‌پذیرم</button>
			<button class="btn btn-error mt-2" disabled={loading} onclick={() => (modal = false)}>
				لغو
			</button>
		</div>
	{:else}
		<p class="text-lg">این بازه قبلا قرائت شده است.</p>
	{/if}
</Modal>
