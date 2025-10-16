import { ayah_getAudioLink } from '$lib/entity/Ayah'
import type { Reciter } from '$lib/entity/LocalSettings.svelte'
import { Ayah } from '@ghoran/entity'

export class AudioManager {
	audio = $state<HTMLAudioElement>()
	reciter = $state<Reciter>('parhizgar')
	playingIndex = $state(-1)
	paused = $state(true)
	audioReadyState = $state<number>(0)
	audioLoading = $derived(this.audioReadyState <= 1)
	audioDuration = $state(0)
	audioCurrentTime = $state(0)
	playingAyah = $derived.by(() => {
		try {
			return Ayah.get(this.playingIndex)
		} catch {
			return null
		}
	})
	audioSrc = $derived(this.playingAyah && ayah_getAudioLink(this.playingAyah, this.reciter))

	play(ayahIndex: number) {
		if (ayahIndex !== this.playingIndex) {
			this.audioCurrentTime = 0
		}
		this.playingIndex = ayahIndex
		this.paused = false
	}
	pause() {
		this.paused = true
		this.playingIndex = -1
	}
}
