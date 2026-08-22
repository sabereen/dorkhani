import sharp, { type Metadata } from 'sharp'
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

function orientedSize(metadata: Metadata) {
	const swapsDimensions = metadata.orientation && metadata.orientation >= 5
	return {
		width: swapsDimensions ? metadata.height : metadata.width,
		height: swapsDimensions ? metadata.width : metadata.height,
	}
}

async function inspect(buffer: Buffer, label: string) {
	try {
		const metadata = await sharp(buffer, {
			failOn: 'warning',
			limitInputPixels: MAX_INPUT_PIXELS,
		}).metadata()
		if (metadata.format !== 'png' && metadata.format !== 'jpeg') {
			throw new BrandingImageError(`${label} باید فایل PNG یا JPEG باشد.`)
		}
		const { width, height } = orientedSize(metadata)
		if (!width || !height) throw new BrandingImageError(`ابعاد ${label} قابل تشخیص نیست.`)
		return { format: metadata.format, width, height }
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
		const pipeline = sharp(heroUpload, { limitInputPixels: MAX_INPUT_PIXELS })
			.rotate()
			.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
		assets.hero =
			metadata.format === 'png'
				? { data: await pipeline.png({ compressionLevel: 9 }).toBuffer(), mimeType: 'image/png' }
				: { data: await pipeline.jpeg({ quality: 88, progressive: true }).toBuffer(), mimeType: 'image/jpeg' }
	}

	if (iconUpload) {
		const metadata = await inspect(iconUpload, 'آیکن برنامه')
		if (metadata.width !== metadata.height || metadata.width < 512) {
			throw new BrandingImageError('آیکن برنامه باید مربعی و حداقل ۵۱۲ در ۵۱۲ پیکسل باشد.')
		}
		const icon = (size: 192 | 512) =>
			sharp(iconUpload, { limitInputPixels: MAX_INPUT_PIXELS })
				.rotate()
				.resize(size, size, { fit: 'fill' })
				.png({ compressionLevel: 9 })
				.toBuffer()
		const [icon192, icon512] = await Promise.all([icon(192), icon(512)])
		assets.icon192 = icon192
		assets.icon512 = icon512
	}

	return assets
}
