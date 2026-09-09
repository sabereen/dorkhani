import { isCapacitorBuild } from '$lib/config/runtime'
import { Capacitor, registerPlugin } from '@capacitor/core'

type ImageOptions = {
	data: string
	fileName: string
}

interface MediaStorePlugin {
	cacheImage(options: ImageOptions): Promise<{ uri: string }>
	saveImage(options: ImageOptions): Promise<{ uri: string }>
}

const mediaStore = registerPlugin<MediaStorePlugin>('MediaStore')

export function isNativeApp() {
	return isCapacitorBuild && Capacitor.isNativePlatform()
}

export function isAndroidNativeApp() {
	return isNativeApp() && Capacitor.getPlatform() === 'android'
}

function blobToBase64(blob: Blob) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader()
		reader.onerror = () => reject(reader.error || new Error('Unable to read image data.'))
		reader.onload = () => {
			const result = reader.result
			if (typeof result !== 'string') {
				reject(new Error('Unable to read image data.'))
				return
			}
			resolve(result.slice(result.indexOf(',') + 1))
		}
		reader.readAsDataURL(blob)
	})
}

async function imageOptions(blob: Blob, fileName: string): Promise<ImageOptions> {
	return { data: await blobToBase64(blob), fileName }
}

export async function cacheNativeImage(blob: Blob, fileName: string) {
	if (!isAndroidNativeApp()) throw new Error('Native image cache is only available on Android.')
	return mediaStore.cacheImage(await imageOptions(blob, fileName))
}

export async function saveNativeImage(blob: Blob, fileName: string) {
	if (!isAndroidNativeApp()) throw new Error('MediaStore is only available on Android.')
	return mediaStore.saveImage(await imageOptions(blob, fileName))
}
