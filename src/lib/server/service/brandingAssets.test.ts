import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { BrandingImageError, processBrandingImages } from './brandingAssets'

async function imageBlob(width: number, height: number) {
	const buffer = await sharp({
		create: { width, height, channels: 4, background: '#0b6b4f' },
	})
		.png()
		.toBuffer()
	return new Blob([new Uint8Array(buffer)], { type: 'image/png' })
}

describe('branding image processing', () => {
	it('optimizes the hero and creates both application icon sizes', async () => {
		const form = new FormData()
		form.set('heroImage', await imageBlob(900, 600), 'hero.png')
		form.set('appIcon', await imageBlob(700, 700), 'icon.png')

		const assets = await processBrandingImages(form)

		expect(assets.hero?.mimeType).toBe('image/png')
		expect((await sharp(assets.icon192!).metadata()).width).toBe(192)
		expect((await sharp(assets.icon512!).metadata()).width).toBe(512)
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
