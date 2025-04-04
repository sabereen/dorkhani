<script lang="ts">
	import { fade, slide } from 'svelte/transition'
	import type { PickAyahResult, SelectedAyah } from '../../api/khatm/pickNext/+server'
	import { Ayah } from '@ghoran/entity'
	import { surah_getName } from '$lib/entity/Surah'
	import '@ghoran/text/fonts/uthmanic-hafs-v13/style.css'
	import { invalidateAll } from '$app/navigation'
	import { toast } from '$lib/components/TheToast.svelte'
	import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import IconPlay from '~icons/ic/round-play-arrow'
	import IconPause from '~icons/ic/round-pause'
	import IconContext from '~icons/ic/round-menu-book'

	type Props = {
		khatm: Khatm
	}

	const { khatm }: Props = $props()

	// عدد -1 نمایش دهنده غیر فعال بودن لودینگ است
	// برای اینکه مشخص باشد روی کدام دکمه لودینگ بخورد تعداد آیات را در لودینگ میریزیم
	// هر دکمه‌ای که تعداد آیاتش با این متغیر یکسان بود باید لودینگ بخورد
	let loading = $state(-1)
	let selectedAyat = $state<SelectedAyah[]>([])

	let paused = $state(true)
	let audioCurrentTime = $state(-1)
	let audioDuration = $state(-1)
	let playingIndex = $state(-1)
	const playingAyah = $derived(
		selectedAyat[playingIndex] ? Ayah.get(selectedAyat[playingIndex].index) : null,
	)
	const audioSrc = $derived.by(() => {
		if (!playingAyah) return null
		const surahNumber = playingAyah.surahNumber.toString().padStart(3, '0')
		const ayahNumber = playingAyah.number.toString().padStart(3, '0')
		const fileName = `${surahNumber}${ayahNumber}`
		return `https://asset.nasimrezvan.com/data/Minshawy_Murattal/${fileName}.mp3`
	})

	$inspect(playingAyah?.surah.name + ' ' + playingAyah?.number)

	const isFinished = $derived(selectedAyat[selectedAyat.length - 1]?.index === COUNT_OF_AYAHS - 1)

	let ayahWrapper = $state<HTMLElement>()

	async function pick(count = 1) {
		if (loading !== -1) return

		loading = count

		try {
			const result = await khatm.pickNextAyat(count)
			paused = true
			selectedAyat = result.ayat
			ayahWrapper?.scrollIntoView({ block: 'start', behavior: 'smooth' })

			// این شرط را گذاشته ایم که آیه آخر سوره ناس را نمایش بدهد
			if (!isFinished) {
				invalidateAll()
			}
		} catch (err) {
			console.error(err)
			toast('error', (err as any)?.message || String(err))
		} finally {
			loading = -1
		}
	}

	function play(index: number) {
		if (index !== playingIndex) {
			audioCurrentTime = 0
		}
		playingIndex = index
		paused = false
	}

	function tryPlayNext() {
		if (playingIndex < selectedAyat.length - 1) {
			play(playingIndex + 1)

			document
				.getElementById(`ayah-${playingAyah!.index}`)!
				.scrollIntoView({ block: 'start', behavior: 'smooth' })
		}
	}

	const fontStyleHTML = $derived.by(() => {
		let html: string[] = []
		let lastPage = 0
		for (let i = 0; i < selectedAyat.length; i++) {
			const ayah = Ayah.get(selectedAyat[i].index)
			if (ayah.pageNumber === lastPage) continue
			lastPage = ayah.pageNumber
			const family = `qpc-v1-${lastPage}`
			const src = `${import.meta.env.BASE_URL}fonts/qpc-v1/woff2/p${lastPage}.woff2`
			html.push(`@font-face {font-family: '${family}'; src: url('${src}'); font-display: block;}`)
		}
		return `<style>\n${html.join('\n')}\n</style>`
	})
</script>

{@html fontStyleHTML}

{#if selectedAyat.length}
	<div bind:this={ayahWrapper}>
		{#key audioSrc}
			<audio
				src={audioSrc}
				bind:paused
				bind:duration={audioDuration}
				bind:currentTime={audioCurrentTime}
				onended={tryPlayNext}
			></audio>
		{/key}
		{#each selectedAyat as { index, text, translation }, i (index)}
			{@const ayah = Ayah.get(index)}
			<div class="card" id={`ayah-${index}`} transition:slide|global={{ axis: 'y' }}>
				<div class="card-body">
					{#if ayah.isFirstOfSurah}
						<div class="mb-3">
							<p class="text-center text-xl font-bold">
								سوره {surah_getName(ayah.surah)}
							</p>
							{#if ayah.surah.hasBasmalah}
								<p class="text-center text-lg">بسم الله الرحمن الرحیم</p>
							{/if}
						</div>
					{/if}
					{#if ayah.obligatorySajdah}
						<div class="alert alert-error">
							<p>این آیه دارای سجده واجب است.</p>
						</div>
					{/if}
					<p
						class="mb-4 text-[32px] leading-14 font-normal break-words break-all"
						style:font-family={`qpc-v1-${ayah.pageNumber}`}
					>
						{text}
					</p>
					<p class="text-md mb-4 opacity-80">{translation}</p>
				</div>
				<div class="card-actions relative mx-6 pb-3">
					{#if !paused && playingIndex === i}
						<button class="btn btn-sm btn-outline relative" onclick={() => (paused = true)}>
							<IconPause class="size-5" />
							توقف صوت
						</button>
					{:else}
						<button class="btn btn-sm btn-outline" onclick={() => play(i)}>
							<IconPlay class="size-5" />
							پخش صوت
						</button>
					{/if}
					<button class="btn btn-sm btn-outline">
						<IconContext class="size-5" />
						آیات پیرامون
					</button>
					<span class="grow"></span>
					<p class="self-center text-sm">آیه {ayah.number} {surah_getName(ayah.surah)}</p>
					{#if audioDuration && !paused && playingIndex === i}
						<progress
							transition:fade
							class="progress rounded-0 absolute inset-x-0 bottom-0 h-1 w-full"
							value={audioCurrentTime}
							max={audioDuration}
						></progress>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

<div class="mt-5 flex flex-col text-center">
	{#if !selectedAyat.length}
		<p class="px-4 text-lg text-balance">
			جهت پذیرفتن قرائت یک آیه از این ختم روی دکمه زیر کلیک کنید.
		</p>
	{/if}
	<div class="mt-5 px-4">
		{#if isFinished}
			<div>
				<button class="btn btn-primary btn-block" onclick={invalidateAll}>پایان</button>
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-2">
				{#snippet smallButton(text: string, count: number)}
					<button class="btn btn-outline btn-sm" onclick={() => pick(count)}>
						{#if loading === count}
							<div class="loading loading-md" transition:slide={{ axis: 'x' }}></div>
						{/if}
						{text}
					</button>
				{/snippet}

				<button class="btn btn-primary btn-xl col-span-2" onclick={() => pick(1)}>
					{#if loading === 1}
						<div class="loading loading-md" transition:slide={{ axis: 'x' }}></div>
					{/if}
					{#if selectedAyat.length}
						پذیرفتن یک آیه بیشتر
					{:else}
						پذیرفتن خواندن یک آیه
					{/if}
				</button>

				{@render smallButton('پذیرفتن ۳ آیه متوالی', 3)}
				{@render smallButton('پذیرفتن ۵ آیه متوالی', 5)}
				{@render smallButton('پذیرفتن ۱۰ آیه متوالی', 10)}
				{@render smallButton('پذیرفتن ۲۰ آیه متوالی', 20)}
			</div>
		{/if}
	</div>
</div>
