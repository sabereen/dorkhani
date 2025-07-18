<script lang="ts">
	import '@ghoran/text/fonts/uthmanic-hafs/style.css'
	import { fade, slide } from 'svelte/transition'
	import type { SelectedAyah } from '$api/khatmPart/pickNext/+server'
	import { Ayah } from '@ghoran/entity'
	import { surah_getName } from '$lib/entity/Surah'
	import { toast } from '$lib/components/TheToast.svelte'
	import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
	import IconPlay from '~icons/ic/round-play-arrow'
	import IconPause from '~icons/ic/round-pause'
	import IconContext from '~icons/ic/round-menu-book'
	import IconSettings from '~icons/ic/round-settings'
	import { ayah_getAudioLink, ayah_getExternalLink } from '$lib/entity/Ayah'
	import { useKathmContext } from '../khatm-context.svelte'
	import { getFontManager } from './font.svelte'
	import { watchEager } from '$lib/hooks/watch.svelte'
	import { type QuranFont, SettingsEditor } from '$lib/entity/LocalSettings.svelte'
	import Modal from '$lib/components/Modal.svelte'
	import SettingsAyahKhatm from '../../settings/SettingsAyahKhatm.svelte'
	import { page } from '$app/state'
	import { pushState } from '$app/navigation'
	import { wait } from '$lib/utility/wait'

	const khatmContext = useKathmContext()
	const khatm = $derived(khatmContext.khatm)

	const settingsEditor = SettingsEditor.use()
	settingsEditor.live = true

	type PageState = {
		modalSettings?: boolean
	}

	const modalSettings = $derived(!!(page.state as PageState).modalSettings)
	function openSettings() {
		pushState('', { modalSettings: true } satisfies PageState)
	}

	// عدد -1 نمایش دهنده غیر فعال بودن لودینگ است
	// برای اینکه مشخص باشد روی کدام دکمه لودینگ بخورد تعداد آیات را در لودینگ میریزیم
	// هر دکمه‌ای که تعداد آیاتش با این متغیر یکسان بود باید لودینگ بخورد
	let loading = $state(-1)
	let selectedAyat = $state<SelectedAyah[]>([])

	let paused = $state(true)
	let audioCurrentTime = $state(-1)
	let audioDuration = $state(-1)
	let playingIndex = $state(-1)
	let audioReadyState = $state(0)
	const audioLoading = $derived(audioReadyState <= 1)
	const playingAyah = $derived(
		selectedAyat[playingIndex] ? Ayah.get(selectedAyat[playingIndex].index) : null,
	)
	const audioSrc = $derived(
		playingAyah && ayah_getAudioLink(playingAyah, settingsEditor.config.reciter),
	)

	const isFinished = $derived(selectedAyat[selectedAyat.length - 1]?.index === COUNT_OF_AYAHS - 1)

	let ayahWrapper = $state<HTMLElement>()

	async function pick(count = 1) {
		if (loading !== -1) return

		loading = count

		const waitPromise = wait(1500)

		try {
			const result = await khatm.pickNextAyat({
				count,
				translation: settingsEditor.config.translation,
			})
			paused = true
			playingIndex = -1

			selectedAyat = result.ayat
			ayahWrapper?.scrollIntoView({ block: 'start', behavior: 'smooth' })

			// این شرط را گذاشته ایم که آیه آخر سوره ناس را نمایش بدهد
			if (!isFinished) {
				khatm.refresh()
			}
		} catch (err) {
			console.error(err)
			toast('error', (err as any)?.message || String(err))
		} finally {
			// برای اینکه بین دو کلیک متوالی مدتی فاصله باشد
			// که کاربر اشتباهی چند مرتبه روی دکمه کلیک نکند
			await waitPromise
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

	const font = $derived<QuranFont>(settingsEditor.config.quranFont)
	const fontManager = $derived(getFontManager(font))

	watchEager(
		() => [font, selectedAyat],
		() => {
			if (!selectedAyat.length && !khatm.finished) {
				const ayah = Ayah.get(khatm.versesRead)
				fontManager.preloadAyah(ayah)
			}

			selectedAyat.forEach(({ index }) => {
				const ayah = Ayah.get(index)
				fontManager.preloadAyah(ayah)
			})
		},
	)
</script>

{#if selectedAyat.length}
	<div bind:this={ayahWrapper}>
		{#key audioSrc}
			<audio
				src={audioSrc}
				bind:paused
				bind:duration={audioDuration}
				bind:currentTime={audioCurrentTime}
				bind:readyState={audioReadyState}
				onended={tryPlayNext}
			></audio>
		{/key}

		{#each selectedAyat as { index, textQPC1, textQPC2, textHafs, translation }, i (index)}
			{@const ayah = Ayah.get(index)}
			<div class="card" id={`ayah-${index}`} transition:slide|global={{ axis: 'y' }}>
				<div class="card-body">
					{#if ayah.isFirstOfSurah}
						<div class="mb-3">
							<p class="text-md text-center font-bold">
								سوره {surah_getName(ayah.surah)}
							</p>
							{#if ayah.surah.hasBasmalah}
								<p class="mt-2 text-center text-2xl">بسم الله الرحمن الرحیم</p>
							{/if}
						</div>
					{/if}
					{#if ayah.obligatorySajdah}
						<div class="alert alert-error">
							<p>این آیه دارای سجده واجب است.</p>
						</div>
					{/if}
					<p
						class={[
							'leading-14 mb-4 break-words font-normal transition-opacity',
							fontManager.className,
						]}
						class:opacity-0={fontManager.isLoading(ayah)}
						style:font-family={fontManager.getFontFamily(ayah)}
					>
						{#if font === 'hafs'}{textHafs}{/if}
						{#if font === 'qpc1'}{textQPC1}{/if}
						{#if font === 'qpc2'}{textQPC2}{/if}
						{#if font === 'hafs'}{ayah.number.toLocaleString('ar-IQ')}{/if}
					</p>
					<p class="text-md mb-4 opacity-80">{translation}</p>
				</div>
				<div class="card-actions relative mx-6 gap-0 pb-3">
					{#if !paused && playingIndex === i}
						<button
							type="button"
							class="btn btn-sm btn-outline relative"
							onclick={() => (paused = true)}
						>
							{#if audioLoading}
								<span class="loading loading-ring block size-5"></span>
							{:else}
								<IconPause class="size-5" />
							{/if}
							توقف صوت
						</button>
					{:else}
						<button type="button" class="btn btn-sm btn-outline" onclick={() => play(i)}>
							<IconPlay class="size-5" />
							پخش صوت
						</button>
					{/if}
					<a href={ayah_getExternalLink(ayah)} target="_blank" class="btn btn-sm btn-outline ms-2">
						<IconContext class="size-5" />
						آیات پیرامون
					</a>
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
		<p class="text-balance px-4 text-lg">
			جهت پذیرفتن قرائت یک آیه از این ختم روی دکمه زیر کلیک کنید.
		</p>
	{/if}
	<div class="mt-5 px-4">
		{#if isFinished}
			<div>
				<button class="btn btn-primary btn-block" onclick={() => khatm.refresh()}>پایان</button>
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

				<button
					class="btn btn-primary btn-xl col-span-2 h-[3.3rem] text-xl font-bold"
					onclick={() => pick(1)}
				>
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
				{@render smallButton('پذیرفتن ۷ آیه متوالی', 7)}
				{@render smallButton('پذیرفتن ۱۰ آیه متوالی', 10)}

				<button type="button" class="btn btn-primary !btn-ghost col-span-2" onclick={openSettings}>
					<IconSettings class="size-6" />
					تنظیمات
				</button>
			</div>
		{/if}
	</div>
</div>

<Modal bind:open={() => modalSettings, () => history.back()} contentClass="bg-transparent p-0">
	<SettingsAyahKhatm class="!w-full" />
</Modal>
