<script lang="ts">
	import type { Khatm } from '@prisma/client'
	import { slide } from 'svelte/transition'
	import type { PickAyahResult, SelectedAyah } from '../../api/khatm/pickNext/+server'
	import { Ayah } from '@ghoran/entity'
	import { surah_getName } from '$lib/entity/Surah'
	import '@ghoran/text/fonts/uthmanic-hafs-v13/style.css'
	import { invalidateAll } from '$app/navigation'
	import { toast } from '$lib/components/TheToast.svelte'

	type Props = {
		khatm: Khatm
	}

	const { khatm }: Props = $props()

	// عدد -1 نمایش دهنده غیر فعال بودن لودینگ است
	// برای اینکه مشخص باشد روی کدام دکمه لودینگ بخورد تعداد آیات را در لودینگ میریزیم
	// هر دکمه‌ای که تعداد آیاتش با این متغیر یکسان بود باید لودینگ بخورد
	let loading = $state(-1)
	let selectedAyat = $state<SelectedAyah[]>([])

	let ayahWrapper = $state<HTMLElement>()

	async function pick(count = 1) {
		if (loading !== -1) return

		loading = count

		try {
			const response = await fetch('/api/khatm/pickNext', {
				method: 'POST',
				body: JSON.stringify({
					khatmId: khatm.id,
					count,
				}),
			})

			const result: PickAyahResult = await response.json()

			if (!response.ok) {
				throw result
			}
			selectedAyat = result.ayat
			invalidateAll()
			ayahWrapper?.scrollIntoView({ block: 'start', behavior: 'smooth' })
		} catch (err) {
			console.error(err)
			toast('error', (err as any)?.message || String(err))
		} finally {
			loading = -1
		}
	}
</script>

{#if selectedAyat.length}
	<div bind:this={ayahWrapper}>
		{#each selectedAyat as { index, text, translation } (index)}
			{@const ayah = Ayah.get(index)}
			<div class="card" transition:slide|global={{ axis: 'y' }}>
				<div class="card-body">
					<p class="mb-4 font-[uthmanic-hafs-v13] text-3xl leading-14">
						{text}
						{ayah.number.toLocaleString('ar-IQ')}
					</p>
					<p class="text-md mb-4 opacity-80">{translation}</p>
					<p class="self-end text-sm">آیه {ayah.number} {surah_getName(ayah.surah)}</p>
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

			{@render smallButton('پذیرفتن ۵ آیه متوالی', 5)}
			{@render smallButton('پذیرفتن ۱۰ آیه متوالی', 10)}
			{@render smallButton('پذیرفتن ۲۰ آیه متوالی', 20)}
			{@render smallButton('پذیرفتن ۴۰ آیه متوالی', 40)}
		</div>
	</div>
</div>
