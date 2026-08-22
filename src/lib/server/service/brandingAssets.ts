import { Jimp, JimpMime } from 'jimp'
import type { BrandingAssets } from './appSettings'

export const MAX_BRANDING_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_INPUT_PIXELS = 25_000_000

export class BrandingImageError extends Error {}

async function getUpload(value: FormDataEntryValue | null, label: string) {
	if (!value || typeof value === 'string' || value.size === 0) return
	if (value.size > MAX_BRANDING_IMAGE_BYTES) {
		throw new BrandingImageError(`حجم ${label} نباید بیشتر از ۵ مگابایت باشد.`)
	}
	return Buffer.from(await value.arrayBuffer())
}

type ImageFormat = 'png' | 'jpeg'

function getImageFormat(buffer: Buffer): ImageFormat | undefined {
	if (
		buffer.length >= 8 &&
		buffer
			.subarray(0, 8)
			.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
	) {
		return 'png'
	}
	if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
		return 'jpeg'
	}
}

function exceedsPixelLimit(width: number, height: number) {
	return !width || !height || width * height > MAX_INPUT_PIXELS
}

function assertPixelLimit(buffer: Buffer, format: ImageFormat) {
	if (format === 'png') {
		if (buffer.length < 24 || buffer.toString('ascii', 12, 16) !== 'IHDR') throw new Error('Invalid PNG')
		if (exceedsPixelLimit(buffer.readUInt32BE(16), buffer.readUInt32BE(20))) {
			throw new Error('Image exceeds pixel limit')
		}
		return
	}

	for (let offset = 2; offset < buffer.length - 8; ) {
		if (buffer[offset++] !== 0xff) continue
		while (buffer[offset] === 0xff) offset++
		const marker = buffer[offset++]
		if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue
		if (offset + 2 > buffer.length) throw new Error('Invalid JPEG')
		const length = buffer.readUInt16BE(offset)
		if (length < 2 || offset + length > buffer.length) throw new Error('Invalid JPEG')
		if (
			(marker >= 0xc0 && marker <= 0xc3) ||
			(marker >= 0xc5 && marker <= 0xc7) ||
			(marker >= 0xc9 && marker <= 0xcb) ||
			(marker >= 0xcd && marker <= 0xcf)
		) {
			if (
				length < 7 ||
				exceedsPixelLimit(buffer.readUInt16BE(offset + 5), buffer.readUInt16BE(offset + 3))
			) {
				throw new Error('Image exceeds pixel limit')
			}
			return
		}
		offset += length
	}

	throw new Error('Invalid JPEG')
}

async function inspect(buffer: Buffer, label: string) {
	try {
		const format = getImageFormat(buffer)
		if (!format) {
			throw new BrandingImageError(`${label} باید فایل PNG یا JPEG باشد.`)
		}
		assertPixelLimit(buffer, format)
		const image = await Jimp.read(buffer, {
			[JimpMime.jpeg]: {
				maxResolutionInMP: MAX_INPUT_PIXELS / 1_000_000,
				maxMemoryUsageInMB: Math.ceil((MAX_INPUT_PIXELS * 4) / (1024 * 1024)),
			},
		})
		const { width, height } = image
		if (!width || !height) throw new BrandingImageError(`ابعاد ${label} قابل تشخیص نیست.`)
		return { format, image, width, height }
	} catch (error) {
		if (error instanceof BrandingImageError) throw error
		throw new BrandingImageError(`${label} معتبر نیست یا پردازش آن امکان‌پذیر نیست.`)
	}
}

export async function processBrandingImages(form: FormData): Promise<BrandingAssets> {
	const [heroUpload, iconUpload] = await Promise.all([
		getUpload(form.get('heroImage'), 'تصویر Hero'),
		getUpload(form.get('appIcon'), 'آیکن برنامه'),
	])
	const assets: BrandingAssets = {}

	if (heroUpload) {
		const metadata = await inspect(heroUpload, 'تصویر Hero')
		if (metadata.width < 480 || metadata.height < 320) {
			throw new BrandingImageError('ابعاد تصویر Hero باید حداقل ۴۸۰ در ۳۲۰ پیکسل باشد.')
		}
		if (metadata.width > 1600 || metadata.height > 1600) {
			metadata.image.scaleToFit({ w: 1600, h: 1600 })
		}
		assets.hero =
			metadata.format === 'png'
				? {
						data: await metadata.image.getBuffer(JimpMime.png, { deflateLevel: 9 }),
						mimeType: 'image/png',
					}
				: {
						data: await metadata.image.getBuffer(JimpMime.jpeg, { quality: 88 }),
						mimeType: 'image/jpeg',
					}
	}

	if (iconUpload) {
		const metadata = await inspect(iconUpload, 'آیکن برنامه')
		if (metadata.width !== metadata.height || metadata.width < 512) {
			throw new BrandingImageError('آیکن برنامه باید مربعی و حداقل ۵۱۲ در ۵۱۲ پیکسل باشد.')
		}
		const icon = (size: 192 | 512) =>
			metadata.image
				.clone()
				.resize({ w: size, h: size })
				.getBuffer(JimpMime.png, { deflateLevel: 9 })
		const [icon192, icon512] = await Promise.all([icon(192), icon(512)])
		assets.icon192 = icon192
		assets.icon512 = icon512
	}

	return assets
}
