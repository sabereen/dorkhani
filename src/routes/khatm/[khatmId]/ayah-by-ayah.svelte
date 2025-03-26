<script lang="ts">
	import type { Khatm } from '@prisma/client'
	import { slide } from 'svelte/transition'
	import type { PickAyahResult } from '../../api/khatm/pickNextAyah/+server'
	import { Ayah } from '@ghoran/entity'
	import { surah_getName } from '$lib/entity/Surah'
	import '@ghoran/text/fonts/uthmanic-hafs-v13/style.css'
	import { invalidateAll } from '$app/navigation'
	import { toast } from '$lib/components/TheToast.svelte'

	type Props = {
		khatm: Khatm
	}

	const { khatm }: Props = $props()

	let loading = $state(false)
	let ayah = $state<Ayah | null>()
	let ayahText = $state('')
	let ayahTranslation = $state('')

	async function pick() {
		loading = true

		try {
			const response = await fetch('/api/khatm/pickNextAyah', {
				method: 'POST',
				body: JSON.stringify({
					khatmId: khatm.id,
				}),
			})

			const result: PickAyahResult = await response.json()

			if (!response.ok) {
				throw result
			}
			ayah = Ayah.get(result.ayahIndex)
			ayahText = result.ayahText
			ayahTranslation = result.ayahTranslation
			invalidateAll()
		} catch (err) {
			console.error(err)
			toast('error', (err as any)?.message || String(err))
		} finally {
			loading = false
		}
	}
</script>

{#if ayah}
	<div class="card" transition:slide={{ axis: 'y' }}>
		<div class="card-body">
			<p class="mb-4 font-[uthmanic-hafs-v13] text-3xl leading-14">
				{ayahText}
				{ayah.number.toLocaleString('ar-IQ')}
			</p>
			<p class="text-md mb-4 opacity-80">{ayahTranslation}</p>
			<p class="self-end text-sm">آیه {ayah.number} {surah_getName(ayah.surah)}</p>
		</div>
	</div>
{/if}

<div class="mt-5 flex flex-col text-center">
	{#if !ayah}
		<p class="text-lg">جهت قرائت یک آیه دیگر روی دکمه زیر کلیک کنید.</p>
	{/if}
	<div class="mt-5">
		<button class="btn btn-primary btn-xl" onclick={pick}>
			{#if loading}
				<div class="loading loading-md" transition:slide={{ axis: 'x' }}></div>
			{/if}
			{#if ayah}
				خواندن آیه بیشتر
			{:else}
				خواندن یک آیه
			{/if}
		</button>
	</div>
</div>
