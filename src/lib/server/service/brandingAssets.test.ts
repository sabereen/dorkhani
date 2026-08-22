import { describe, expect, it } from 'vitest'
import { Jimp, JimpMime } from 'jimp'
import { BrandingImageError, processBrandingImages } from './brandingAssets'

async function imageBlob(width: number, height: number) {
	const buffer = await new Jimp({ width, height, color: '#0b6b4fff' }).getBuffer(JimpMime.png)
	return new Blob([new Uint8Array(buffer)], { type: 'image/png' })
}

describe('branding image processing', () => {
	it('optimizes the hero and creates both application icon sizes', async () => {
		const form = new FormData()
		form.set('heroImage', await imageBlob(900, 600), 'hero.png')
		form.set('appIcon', await imageBlob(700, 700), 'icon.png')

		const assets = await processBrandingImages(form)

		expect(assets.hero?.mimeType).toBe('image/png')
		expect((await Jimp.read(assets.icon192!)).width).toBe(192)
		expect((await Jimp.read(assets.icon512!)).width).toBe(512)
	})

	it('rejects a non-square application icon', async () => {
		const form = new FormData()
		form.set('appIcon', await imageBlob(700, 600), 'icon.png')

		await expect(processBrandingImages(form)).rejects.toBeInstanceOf(BrandingImageError)
	})

	it('rejects uploads larger than five megabytes', async () => {
		const form = new FormData()
		form.set('heroImage', new Blob([new Uint8Array(5 * 1024 * 1024 + 1)]), 'hero.png')

		await expect(processBrandingImages(form)).rejects.toThrow('۵ مگابایت')
	})
})
