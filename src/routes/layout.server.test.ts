import { describe, expect, it, vi } from 'vitest'

vi.mock('$service/appSettings', () => ({
	appSettings_store: {
		config: {
			supportLink: '',
			branding: {
				name: 'نام سفارشی',
				tagline: 'شعار',
				heroTitle: 'عنوان',
				heroHighlight: 'برجسته',
				heroDescription: 'توضیح',
				heroImageAlt: 'تصویر',
				seoTitle: 'SEO',
				seoDescription: 'SEO description',
				revision: 'revision-3',
			},
		},
	},
}))

import { load } from './+layout.server'

describe('root layout branding', () => {
	it('publishes versioned brand asset URLs to every page', () => {
		const data = load({ locals: { user: null } } as never)

		expect(data).toMatchObject({
			branding: {
				name: 'نام سفارشی',
				heroImageUrl: '/branding/hero?v=revision-3',
				icon192Url: '/branding/icon/192?v=revision-3',
			},
		})
	})
})
