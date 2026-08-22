<script lang="ts">
	import { localeTag } from '$lib/i18n/format'
	import { ayah_getExternalLink } from '$lib/entity/Ayah'
	import { surah_getName } from '$lib/entity/Surah'
	import type { AyahInfo } from '$service/quran'
	import { Ayah } from '@ghoran/entity'
	import { fade, slide } from 'svelte/transition'
	import type { FontManager } from './FontManager.svelte'
	import type { AudioManager } from './AudioManager.svelte'
	import * as m from '$lib/paraglide/messages.js'

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

<article
	class="ui-card ui-quran-ayah"
	id={`ayah-${ayah.index}`}
	transition:slide|global={{ axis: 'y' }}
>
	<div class="ui-card-body">
		{#if ayah.isFirstOfSurah}
			<header class="ui-quran-surah-heading">
				<span>{m.quran_surah()}</span>
				<h2>{surah_getName(ayah.surah)}</h2>
				{#if ayah.surah.hasBasmalah}
					<p lang="ar" dir="rtl">بسم الله الرحمن الرحیم</p>
				{/if}
			</header>
		{/if}
		{#if ayah.obligatorySajdah}
			<div class="ui-alert ui-alert-error">
				<p>{m.quran_obligatory_sajdah()}</p>
			</div>
		{/if}
		<p
			class={['ui-quran-ayah-text transition-opacity', fontManager.className]}
			lang="ar"
			dir="rtl"
			class:opacity-0={fontManager.isLoading(ayah)}
			style:font-family={fontManager.getFontFamily(ayah)}
		>
			{#if font === 'hafs'}{ayahInfo.textHafs}{/if}
			{#if font === 'qpc1'}{ayahInfo.textQPC1}{/if}
			{#if font === 'qpc2'}{ayahInfo.textQPC2}{/if}
			{#if font === 'hafs'}{ayah.number.toLocaleString('ar-IQ')}{/if}
		</p>
		<p class="ui-quran-translation" lang="fa" dir="rtl">{ayahInfo.translation}</p>
	</div>
	<footer class="ui-quran-ayah-footer">
		{#if !audioManager.paused && audioManager.playingIndex === ayah.index}
			<button
				type="button"
				class="ui-btn ui-btn-sm ui-btn-soft relative"
				onclick={() => audioManager.pause()}
			>
				{#if audioManager.audioLoading}
					<span class="ui-spinner block"></span>
				{:else}
					<IconPause class="size-5" />
				{/if}
				{m.quran_pause_audio()}
			</button>
		{:else}
			<button
				type="button"
				class="ui-btn ui-btn-sm ui-btn-soft"
				onclick={() => audioManager.play(ayah.index)}
			>
				<IconPlay class="size-5" />
				{m.quran_play_audio()}
			</button>
		{/if}
		<a href={ayah_getExternalLink(ayah)} target="_blank" class="ui-btn ui-btn-sm ui-btn-ghost">
			<IconContext class="size-5" />
			{m.quran_context()}
		</a>
		<p class="ui-quran-ayah-meta">
			{m.quran_ayah_meta({ number: ayah.number.toLocaleString(localeTag()), surah: surah_getName(ayah.surah) })}
		</p>
		{#if audioManager.audioDuration && !audioManager.paused && audioManager.playingIndex === ayah.index}
			<progress
				transition:fade
				class="ui-progress rounded-0 absolute bottom-0 left-0 right-0 h-1 w-full"
				value={audioManager.audioCurrentTime}
				max={audioManager.audioDuration}
			></progress>
		{/if}
	</footer>
</article>
