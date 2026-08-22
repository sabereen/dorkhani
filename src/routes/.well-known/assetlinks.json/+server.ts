import { env } from '$env/dynamic/private'
import {
	createAndroidAssetLinks,
	parseAndroidCertificateFingerprints,
} from '$lib/server/android-app-links'
import { json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = () => {
	try {
		const fingerprints = parseAndroidCertificateFingerprints(
			env.ANDROID_SHA256_CERT_FINGERPRINTS,
		)
		if (fingerprints.length === 0) {
			return json({ message: 'Android App Links are not configured.' }, { status: 503 })
		}
		return json(createAndroidAssetLinks(fingerprints), {
			headers: { 'cache-control': 'public, max-age=3600' },
		})
	} catch {
		return json({ message: 'Android App Links configuration is invalid.' }, { status: 503 })
	}
}
