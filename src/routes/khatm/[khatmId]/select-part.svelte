<script lang="ts" module>
	import type { KhatmPart as IKhatmPart } from '@prisma/client'
	export type Props = {
		parts: IKhatmPart[]
		onFinished?: () => void
	}
</script>

<script lang="ts">
	import Modal from '$lib/components/Modal.svelte'
	import { Ayah } from '@ghoran/entity'
	import { page } from '$app/state'
	import { findNonOverlappingSubranges } from '$lib/utility/findNonOverlappingSubranges'
	import { invalidateAll } from '$app/navigation'
	import { Juz } from '$lib/entity/Juz'
	import { Surah } from '$lib/entity/Surah'
	import { Page } from '$lib/entity/Page'
	import type { QuranRange } from '$lib/entity/Range'

	const props: Props = $props()

	const juzList = Juz.getAll() as Juz[]
	const surahList = Surah.getAll() as Surah[]
	const pageList = Page.getAll() as Page[]

	const juzRanges = juzList.map((i) => i.toRange())
	const surahRanges = surahList.map((i) => i.toRange())
	const pageRanges = pageList.map((i) => i.toRange())

	const selectableJuzParts = $derived(findNonOverlappingSubranges(props.parts, juzRanges))
	const selectableSurahParts = $derived(findNonOverlappingSubranges(props.parts, surahRanges))
	const selectablePageParts = $derived(findNonOverlappingSubranges(props.parts, pageRanges))

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

	let selected = $state({
		start: 0,
		end: 0,
	})

	function openModal(start: number, end: number) {
		modal = true
		selected = { start, end }
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

<div class="relative grid text-center text-sm">
	{#snippet renderSelectableRanges(ranges: { start: number; end: number }[], column: number)}
		{#each ranges as range (range.start + ':' + range.end)}
			<button
				class="col-start-1 min-h-4 w-full cursor-pointer bg-gray-300/75 hover:bg-gray-500/60 dark:bg-gray-500/85 dark:hover:bg-gray-400/75"
				style:grid-column-start={column}
				style:grid-row-start={range.start + 1}
				style:grid-row-end={range.end + 1}
				onclick={() => openModal(range.start, range.end)}
				aria-label="selectable range"
			></button>
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

	{#each props.parts as part (part.id)}
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

<Modal bind:open={modal}>
	{#if selected}
		آیا قرائت این بازه را تقبل می‌کنید؟

		{@const start = Ayah.get(selected.start)}
		{@const end = Ayah.get(selected.end - 1)}
		<p class="my-2 text-sm">
			از آیه {start.ayahNumber}
			{start.surah.name}
			تا انتهای آیه {end.ayahNumber}
			{end.surah.name}
			<a
				href={`https://ketabmobin.com/ayah/${start.index}`}
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
