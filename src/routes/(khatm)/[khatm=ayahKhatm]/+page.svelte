<script lang="ts">
	import '@ghoran/text/fonts/uthmanic-hafs/style.css'
	import { slide } from 'svelte/transition'
	import type { AyahInfo } from '$service/quran'
	import { toast } from '$lib/components/TheToast.svelte'
	import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
	import { useKathmContext } from '../khatm-context.svelte'
	import { SettingsEditor } from '$lib/entity/LocalSettings.svelte'
	import Modal from '$lib/components/Modal.svelte'
	import SettingsAyahKhatm from '../../settings/SettingsAyahKhatm.svelte'
	import { page } from '$app/state'
	import { pushState } from '$app/navigation'
	import { wait } from '$lib/utility/wait'
	import { AudioManager } from '$lib/components/Quran/AudioManager.svelte'
	import MultipleAyah from '$lib/components/Quran/MultipleAyah.svelte'
	import IconSparkle from '~icons/ic/round-auto-awesome'
	import IconTune from '~icons/ic/round-tune'
	import IconDone from '~icons/ic/round-check-circle'

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
</script>

{#if selectedAyat.length}
	<div class="ui-khatm-panel" bind:this={ayahWrapper}>
		<MultipleAyah ayahInfoList={selectedAyat} {audioManager} />
	</div>
{/if}
<section class="ui-khatm-ayah-picker">
	{#if !selectedAyat.length}
		<div class="ui-khatm-panel-header">
			<span class="ui-khatm-option-icon"><IconSparkle /></span>
			<h2>سهم امروز شما از این ختم</h2>
			<p>با یک انتخاب، نزدیک‌ترین آیات خوانده‌نشده به شما سپرده می‌شود.</p>
		</div>
	{/if}
	<div>
		{#if isFinished}
			<div class="ui-khatm-confirm">
				<span class="ui-khatm-confirm-icon"><IconDone /></span>
				<h2>آخرین آیه هم به پایان رسید</h2>
				<button class="ui-btn ui-btn-success ui-btn-block" onclick={() => khatm.refresh()}>
					پایان
					{#if khatm.isSerial}
						{khatm.getRoundTitle()}
					{/if}
				</button>
			</div>
		{:else}
			<div class="ui-khatm-pick-grid">
				{#snippet smallButton(text: string, count: number)}
					<button class="ui-btn ui-btn-outline ui-btn-sm" onclick={() => pick(count)}>
						{#if loading === count}
							<div class="ui-spinner ui-spinner-md" transition:slide={{ axis: 'x' }}></div>
						{/if}
						{text}
					</button>
				{/snippet}

				<button
					class="ui-btn ui-btn-primary ui-btn-xl ui-btn-block ui-khatm-pick-primary col-span-2"
					onclick={() => pick(1)}
				>
					{#if loading === 1}
						<div class="ui-spinner ui-spinner-md" transition:slide={{ axis: 'x' }}></div>
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

				<button type="button" class="ui-btn ui-btn-ghost col-span-2" onclick={openSettings}>
					<IconTune class="size-5" />
					تنظیم ترجمه، صوت و نمایش
				</button>
			</div>
		{/if}
	</div>
</section>

<Modal bind:open={() => modalSettings, () => history.back()} contentClass="bg-transparent p-0">
	<SettingsAyahKhatm class="!w-full" legend="تنظیم ترجمه، صوت و نمایش" />
</Modal>
