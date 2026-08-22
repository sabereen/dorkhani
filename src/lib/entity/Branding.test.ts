import { describe, expect, it } from 'vitest'
import { DEFAULT_BRANDING_CONFIG, getPublicBranding, normalizeBrandingConfig } from './Branding'

describe('branding localization', () => {
	it('normalizes legacy flat branding and falls back to Persian per field', () => {
		const branding = normalizeBrandingConfig({
			name: 'نام قدیمی',
			tagline: 'شعار قدیمی',
			revision: 'legacy',
		})
		expect(branding.texts.fa.name).toBe('نام قدیمی')
		expect(branding.texts.ar.name).toBe('نام قدیمی')
		expect(branding.texts.en.tagline).toBe('شعار قدیمی')
		expect(branding.revision).toBe('legacy')
	})

	it('returns only the selected public text and shared asset URLs', () => {
		const branding = getPublicBranding(DEFAULT_BRANDING_CONFIG, 'en', '/app')
		expect(branding.name).toBe('Group Quran Khatm')
		expect(branding.heroImageUrl).toBe('/app/branding/hero?v=default')
		expect(branding).not.toHaveProperty('texts')
	})
})
