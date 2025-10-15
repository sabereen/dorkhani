<script lang="ts">
	import { Ayah } from '@ghoran/entity'
	import SingleAyah from './SingleAyah.svelte'
	import { watchEager } from '$lib/hooks/watch.svelte'
	import { AudioManager } from './AudioManager.svelte'
	import { SettingsEditor, type QuranFont } from '$lib/entity/LocalSettings.svelte'
	import { getFontManager } from '../../../routes/(khatm)/[khatm=ayahKhatm]/font.svelte'
	import type { AyahInfo } from '$service/quran'

	type Props = {
		ayahInfoList: AyahInfo[]
		audioManager?: AudioManager
	}
	const { ayahInfoList: selectedAyat, audioManager = new AudioManager() }: Props = $props()

	const settingsEditor = SettingsEditor.use()
	settingsEditor.live = true

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

<div>
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
