<script lang="ts">
	import { ayah_getExternalLink } from '$lib/entity/Ayah'
	import { surah_getName } from '$lib/entity/Surah'
	import type { AyahInfo } from '$service/quran'
	import { Ayah } from '@ghoran/entity'
	import { fade, slide } from 'svelte/transition'
	import type { FontManager } from './FontManager.svelte'
	import type { AudioManager } from './AudioManager.svelte'

	import IconPlay from '~icons/ic/round-play-arrow'
	import IconPause from '~icons/ic/round-pause'
	import IconContext from '~icons/ic/round-menu-book'

	type Props = {
		ayahInfo: AyahInfo
		font: 'hafs' | 'qpc1' | 'qpc2' | 'hafs'
		fontManager: FontManager
		audioManager: AudioManager
	}

	const { ayahInfo, font, fontManager, audioManager }: Props = $props()

	const ayah = $derived(Ayah.get(ayahInfo.index))
</script>

<div class="card" id={`ayah-${ayah.index}`} transition:slide|global={{ axis: 'y' }}>
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
			class={['leading-14 mb-4 break-words font-normal transition-opacity', fontManager.className]}
			class:opacity-0={fontManager.isLoading(ayah)}
			style:font-family={fontManager.getFontFamily(ayah)}
		>
			{#if font === 'hafs'}{ayahInfo.textHafs}{/if}
			{#if font === 'qpc1'}{ayahInfo.textQPC1}{/if}
			{#if font === 'qpc2'}{ayahInfo.textQPC2}{/if}
			{#if font === 'hafs'}{ayah.number.toLocaleString('ar-IQ')}{/if}
		</p>
		<p class="text-md mb-4 opacity-80">{ayahInfo.translation}</p>
	</div>
	<div class="card-actions relative mx-6 gap-0 pb-3">
		{#if !audioManager.paused && audioManager.playingIndex === ayah.index}
			<button
				type="button"
				class="btn btn-sm btn-outline relative"
				onclick={() => audioManager.pause()}
			>
				{#if audioManager.audioLoading}
					<span class="loading loading-ring block size-5"></span>
				{:else}
					<IconPause class="size-5" />
				{/if}
				توقف صوت
			</button>
		{:else}
			<button
				type="button"
				class="btn btn-sm btn-outline"
				onclick={() => audioManager.play(ayah.index)}
			>
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
		{#if audioManager.audioDuration && !audioManager.paused && audioManager.playingIndex === ayah.index}
			<progress
				transition:fade
				class="progress rounded-0 absolute inset-x-0 bottom-0 h-1 w-full"
				value={audioManager.audioCurrentTime}
				max={audioManager.audioDuration}
			></progress>
		{/if}
	</div>
</div>
