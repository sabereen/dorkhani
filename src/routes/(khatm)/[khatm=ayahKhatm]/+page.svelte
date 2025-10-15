<script lang="ts">
	import '@ghoran/text/fonts/uthmanic-hafs/style.css'
	import { slide } from 'svelte/transition'
	import type { AyahInfo } from '$service/quran'
	import { Ayah } from '@ghoran/entity'
	import { toast } from '$lib/components/TheToast.svelte'
	import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
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
	import SingleAyah from '$lib/components/Quran/SingleAyah.svelte'
	import { AudioManager } from '$lib/components/Quran/AudioManager.svelte'

	const khatmContext = useKathmContext()
	const khatm = $derived(khatmContext.khatm)

	const settingsEditor = SettingsEditor.use()
	settingsEditor.live = true

	const audioManager = new AudioManager()

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
	let selectedAyat = $state<AyahInfo[]>([])

	$effect(() => {
		audioManager.reciter = settingsEditor.config.reciter
	})

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
			audioManager.pause()

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

	function tryPlayNext() {
		if (audioManager.playingIndex < selectedAyat[0].index + selectedAyat.length - 1) {
			audioManager.play(audioManager.playingIndex + 1)

			document
				.getElementById(`ayah-${audioManager.playingAyah!.index}`)!
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
		{#key audioManager.audioSrc}
			<audio
				bind:this={audioManager.audio}
				src={audioManager.audioSrc}
				bind:paused={audioManager.paused}
				bind:duration={audioManager.audioDuration}
				bind:currentTime={audioManager.audioCurrentTime}
				bind:readyState={audioManager.audioReadyState}
				onended={tryPlayNext}
			></audio>
		{/key}

		{#each selectedAyat as ayahInfo (ayahInfo.index)}
			<SingleAyah {font} {ayahInfo} {fontManager} {audioManager} />
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
