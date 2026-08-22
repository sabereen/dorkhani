import { describe, expect, it } from 'vitest'
import {
	ANDROID_APP_ID,
	createAndroidAssetLinks,
	parseAndroidCertificateFingerprints,
} from './android-app-links'

const fingerprint = Array.from({ length: 32 }, (_, index) =>
	index.toString(16).padStart(2, '0'),
).join(':')

describe('Android App Links contract', () => {
	it('normalizes and deduplicates certificate fingerprints', () => {
		expect(parseAndroidCertificateFingerprints(`${fingerprint}, ${fingerprint.toUpperCase()}`)).toEqual([
			fingerprint.toUpperCase(),
		])
	})

	it('rejects malformed certificate fingerprints', () => {
		expect(() => parseAndroidCertificateFingerprints('invalid')).toThrow()
	})

	it('creates an assetlinks statement for the Android application', () => {
		const [statement] = createAndroidAssetLinks([fingerprint.toUpperCase()])
		expect(statement.target.package_name).toBe(ANDROID_APP_ID)
		expect(statement.target.sha256_cert_fingerprints).toEqual([fingerprint.toUpperCase()])
	})
})
