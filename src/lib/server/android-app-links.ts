const sha256Fingerprint = /^(?:[0-9a-f]{2}:){31}[0-9a-f]{2}$/i

export const ANDROID_APP_ID = 'ir.dorkhani.app'

export function parseAndroidCertificateFingerprints(value: string | undefined) {
	if (!value?.trim()) return []
	const fingerprints = [...new Set(value.split(',').map((item) => item.trim().toUpperCase()))]
	if (fingerprints.some((fingerprint) => !sha256Fingerprint.test(fingerprint))) {
		throw new Error('ANDROID_SHA256_CERT_FINGERPRINTS contains an invalid SHA-256 fingerprint.')
	}
	return fingerprints
}

export function createAndroidAssetLinks(fingerprints: string[]) {
	return [
		{
			relation: ['delegate_permission/common.handle_all_urls'],
			target: {
				namespace: 'android_app',
				package_name: ANDROID_APP_ID,
				sha256_cert_fingerprints: fingerprints,
			},
		},
	]
}
