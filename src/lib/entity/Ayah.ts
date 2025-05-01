import type { Ayah } from '@ghoran/entity'
import type { Reciter } from './LocalSettings.svelte'

export function ayah_getKetabMobinLink(ayah: Ayah) {
	return `https://ketabmobin.com/ayah/${ayah.index}`
}

export function ayah_getExternalLink(ayah: Ayah) {
	return ayah_getKetabMobinLink(ayah)
}

const reciterMap: Record<Reciter, string> = {
	parhizgar: 'Parhizgar',
	minshawi: 'Minshawy_Murattal',
	husari: 'Husary',
	alafasi: 'Alafasy',
	abdulbasit: 'Abdulbasit',
}

export function ayah_getAudioLink(ayah: Ayah, reciter: Reciter) {
	const surahNumber = ayah.surahNumber.toString().padStart(3, '0')
	const ayahNumber = ayah.number.toString().padStart(3, '0')
	const fileName = `${surahNumber}${ayahNumber}`
	return `https://asset.nasimrezvan.com/data/${reciterMap[reciter] || reciterMap.minshawi}/${fileName}.mp3`
}
