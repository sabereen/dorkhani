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
	import { Surah, Page, Ayah } from '@ghoran/entity'
	import { juzList } from '@ghoran/metadata'
	import { COUNT_OF_PAGES, COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
	import { page } from '$app/state'
	const props: Props = $props()

	const surahList = Surah.getAll()
	const pageList = new Array(COUNT_OF_PAGES).fill(0).map((_, i) => Page.get(i))

	let modal = $state(false)

	let selected = $state({
		start: 0,
		end: 0,
	})
	const selectedStartAyah = $derived(Ayah.get(selected.start))
	const selectedEndAyah = $derived(Ayah.get(selected.end))

	function openModal(start: number, length: number) {
		modal = true
		selected = { start, end: start + length }
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
			const { count } = await response.json()
			console.log(`created ${count} rows`)
			modal = false
			props.onFinished?.()
		} catch (err) {
			alert(err)
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

	{#snippet verticalRange(ayahCount: number, firstAyah: number, name: string, order: number)}
		<button
			class="absolute w-1/3 cursor-pointer overflow-hidden border border-blue-200 hover:bg-blue-200/20"
			style:height={ayahCount / 62.36 + '%'}
			style:top={firstAyah / 62.36 + '%'}
			style:right={(100 * (order - 1)) / 3 + '%'}
			onclick={() => openModal(firstAyah, ayahCount)}
		>
			{name}
		</button>
	{/snippet}

	<div class="text-xs">
		{#each surahList as surah}
			{@render verticalRange(surah.ayahCount, surah.firstAyahIndex, surah.name, 1)}
		{/each}
	</div>

	<div>
		{#each juzList as juz, index}
			{@const ayahCount = (juzList[index + 1] || 6236) - juz}
			{@render verticalRange(ayahCount, juz, `جزء ${index + 1}`, 2)}
		{/each}
	</div>

	<div class="text-xs">
		{#each pageList as page}
			{@const ayahCount = page.lastAyahIndex - page.firstAyahIndex + 1}
			{@render verticalRange(ayahCount, page.firstAyahIndex, `صفحه ${page.pageNumber}`, 3)}
		{/each}
	</div>
</div>

<Modal bind:open={modal}>
	آیا قرائت این بازه را تقبل می‌کنید؟
	<p>
		از آیه {selectedStartAyah.ayahNumber} سوره‌ی {selectedStartAyah.surah.name}
		تا ابتدای آیه {selectedEndAyah.ayahNumber} سوره‌ی {selectedEndAyah.surah.name}
	</p>

	<a
		href={`https://ketabmobin.com/ayah/${selectedStartAyah.index}`}
		target="_blank"
		class="badge badge-info badge-outline"
	>
		مشاهده آیات
	</a>

	<div>
		<button class="btn btn-primary mt-2" disabled={loading} onclick={markAsRead}>می‌پذیرم</button>
	</div>
</Modal>
