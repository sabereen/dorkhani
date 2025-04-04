import type { Ayah } from '@ghoran/entity'

export function ayah_getKetabMobinLink(ayah: Ayah) {
	return `https://ketabmobin.com/ayah/${ayah.index}`
}

export function ayah_getExternalLink(ayah: Ayah) {
	return ayah_getKetabMobinLink(ayah)
}

export function ayah_getAudioLink(ayah: Ayah) {
	const surahNumber = ayah.surahNumber.toString().padStart(3, '0')
	const ayahNumber = ayah.number.toString().padStart(3, '0')
	const fileName = `${surahNumber}${ayahNumber}`
	return `https://asset.nasimrezvan.com/data/Minshawy_Murattal/${fileName}.mp3`
}
