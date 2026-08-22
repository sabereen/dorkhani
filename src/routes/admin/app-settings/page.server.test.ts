import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_BRANDING_CONFIG } from '$lib/entity/Branding'

const serviceMock = vi.hoisted(() => {
	const branding = {
		name: 'ختم جمعی قرآن',
		tagline: 'هر آیه، یک قدم روشن',
		heroTitle: 'هر آیه، یک قدم؛',
		heroHighlight: 'هر همراه، یک نور',
		heroDescription: 'توضیح Hero',
		heroImageAlt: 'تصویر Hero',
		seoTitle: 'عنوان SEO',
		seoDescription: 'توضیح SEO',
		revision: 'default',
	}
	return {
		setConfig: vi.fn(),
		processBrandingImages: vi.fn(),
		store: {
			config: {
				supportLink: '',
				staleKhatmRetentionDays: 30,
				notification: { eitaa: false },
				aiKhatmReview: { enabled: false },
				branding,
			},
		},
	}
})

vi.mock('$service/appSettings', () => ({
	appSettings_store: serviceMock.store,
	appSettingsService_setConfig: serviceMock.setConfig,
	MIN_STALE_KHATM_RETENTION_DAYS: 1,
	MAX_STALE_KHATM_RETENTION_DAYS: 3650,
}))
vi.mock('$service/brandingAssets', () => ({
	BrandingImageError: class BrandingImageError extends Error {},
	processBrandingImages: serviceMock.processBrandingImages,
}))
vi.mock('$service/auth', () => ({ auth_ensureIsAdmin: vi.fn() }))

import { actions } from './+page.server'

function submitRetentionDays(value: string) {
	const form = new FormData()
	form.set('supportLink', '')
	form.set('staleKhatmRetentionDays', value)
	for (const [key, fieldValue] of Object.entries(DEFAULT_BRANDING_CONFIG)) {
		if (key !== 'revision') form.set(key, fieldValue)
	}
	return actions.default({
		request: new Request('http://localhost', { method: 'POST', body: form }),
	} as never)
}

function submitForm(form: FormData) {
	return actions.default({
		request: new Request('http://localhost', { method: 'POST', body: form }),
	} as never)
}

describe('admin stale khatm retention setting', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		serviceMock.processBrandingImages.mockResolvedValue({})
	})

	it('rejects a retention period outside the supported range', async () => {
		const result = await submitRetentionDays('0')

		expect(result).toMatchObject({ status: 400 })
		expect(serviceMock.setConfig).not.toHaveBeenCalled()
	})

	it('persists a valid retention period', async () => {
		await submitRetentionDays('45')

		expect(serviceMock.setConfig).toHaveBeenCalledWith(
			expect.objectContaining({ staleKhatmRetentionDays: 45 }),
			{},
		)
	})

	it('rejects an incomplete branding configuration before persisting settings', async () => {
		const form = new FormData()
		form.set('supportLink', '')
		form.set('staleKhatmRetentionDays', '30')

		const result = await submitForm(form)

		expect(result).toMatchObject({ status: 400 })
		expect(serviceMock.setConfig).not.toHaveBeenCalled()
	})

	it('changes the branding revision when a new asset is saved', async () => {
		const asset = new Uint8Array([1, 2, 3])
		serviceMock.processBrandingImages.mockResolvedValue({ icon192: asset, icon512: asset })
		await submitRetentionDays('30')

		expect(serviceMock.setConfig).toHaveBeenCalledWith(
			expect.objectContaining({
				branding: expect.objectContaining({ revision: expect.not.stringMatching(/^default$/) }),
			}),
			{ icon192: asset, icon512: asset },
		)
	})
})
