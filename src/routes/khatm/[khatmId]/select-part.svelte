<script lang="ts" module>
	import type { KhatmPart as IKhatmPart } from '@prisma/client'
	export type Props = {
		parts: IKhatmPart[]
		onFinished?: () => void
	}
</script>

<script lang="ts">
	import Modal from '$lib/components/Modal.svelte'
	import { KhatmPart } from '$lib/entity/KhatmPart'
	import { Ayah } from '@ghoran/entity'
	import { page } from '$app/state'
	import { findNonOverlappingSubranges } from '$lib/utility/findNonOverlappingSubranges'
	import { invalidateAll } from '$app/navigation'
	import { Juz } from '$lib/entity/Juz'
	import { Surah } from '$lib/entity/Surah'
	import { Page } from '$lib/entity/Page'
	import type { QuranRange } from '$lib/entity/Range'

	const props: Props = $props()

	const surahList = Surah.getAll() as Surah[]
	const pageList = Page.getAll() as Page[]
	const juzList = Juz.getAll() as Juz[]

	let modal = $state(false)

	let selected = $state({
		start: 0,
		end: 0,
	})
	const selectableRanges = $derived(findNonOverlappingSubranges(props.parts, selected))
	let finalRange = $state(null as null | typeof selected)

	$effect(() => {
		finalRange = selectableRanges[0]
	})

	function openModal(start: number, length: number) {
		modal = true
		selected = { start, end: start + length }
		finalRange = selectableRanges[0]
	}

	let loading = $state(false)
	/** قسمت انتخاب شده را به عنوان خوانده شده علامت می‌زند */
	async function markAsRead() {
		if (loading || !finalRange) return
		loading = true
		try {
			const response = await fetch(`/khatm/${page.params.khatmId}`, {
				method: 'POST',
				body: JSON.stringify({ start: finalRange.start, end: finalRange.end }),
			})
			if (response.status !== 200) throw new Error('خطا')
			const { count } = await response.json()
			console.log(`created ${count} rows`)
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

<div class="relative h-[15000px]">
	<div class="absolute inset-y-0 w-full bg-gray-500"></div>

	{#each props.parts as plainPart}
		{@const part = new KhatmPart(plainPart)}
		{@const style = part.getStyle()}
		<div
			class="absolute w-full bg-green-500"
			style:height={style.width}
			style:top={style.start}
		></div>
	{/each}

	{#snippet verticalRange(range: QuranRange, order: number)}
		{@const ayahCount = range.end - range.start + 1}
		<button
			class="absolute w-1/3 cursor-pointer overflow-hidden border border-blue-200 hover:bg-blue-200/20"
			style:height={ayahCount / 62.36 + '%'}
			style:top={range.start / 62.36 + '%'}
			style:right={(100 * (order - 1)) / 3 + '%'}
			title={range.title}
			onclick={() => openModal(range.start, ayahCount)}
		>
			{range.title}
		</button>
	{/snippet}

	<div>
		{#each juzList as juz}
			{@render verticalRange(juz.toRange(), 1)}
		{/each}
	</div>

	<div class="text-xs">
		{#each surahList as surah}
			{@render verticalRange(surah.toRange(), 2)}
		{/each}
	</div>

	<div class="text-xs">
		{#each pageList as page}
			{@render verticalRange(page.toRange(), 3)}
		{/each}
	</div>
</div>

<Modal bind:open={modal}>
	{#if selectableRanges.length}
		آیا قرائت این بازه را تقبل می‌کنید؟

		{#each selectableRanges as range}
			{@const start = Ayah.get(range.start)}
			{@const end = Ayah.get(range.end - 1)}
			<label class="my-2 block">
				<input
					type="radio"
					name="part-range"
					bind:group={finalRange}
					class="radio float-right ml-1"
					value={range}
				/>
				<p class="text-sm">
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
			</label>
		{/each}

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
