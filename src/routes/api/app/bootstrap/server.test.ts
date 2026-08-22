import { describe, expect, it, vi } from 'vitest'

vi.mock('$service/appSettings', () => ({
	appSettings_store: {
		config: {
			supportLink: '',
			branding: {
				texts: {
					fa: {
						name: 'نام سفارشی',
						tagline: 'شعار',
						heroTitle: 'عنوان',
						heroHighlight: 'برجسته',
						heroDescription: 'توضیح',
						heroImageAlt: 'تصویر',
						seoTitle: 'SEO',
						seoDescription: 'SEO description',
					},
				},
				revision: 'revision-3',
			},
		},
	},
}))

import { GET } from './+server'

describe('bootstrap API contract', () => {
	it('returns locale, user, providers, and absolute branding URLs', async () => {
		const response = await GET({
			locals: { locale: 'fa', needsLocaleChoice: false, user: null },
			url: new URL('https://example.test/api/app/bootstrap'),
		} as never)
		const data = await response.json()

		expect(data).toMatchObject({
			locale: 'fa',
			needsLocaleChoice: false,
			user: null,
			branding: {
				name: 'نام سفارشی',
				heroImageUrl: 'https://example.test/branding/hero?v=revision-3',
				icon192Url: 'https://example.test/branding/icon/192?v=revision-3',
			},
			authProviders: {
				google: expect.any(Boolean),
				eitaa: expect.any(Boolean),
				bale: expect.any(Boolean),
			},
		})
	})
})
