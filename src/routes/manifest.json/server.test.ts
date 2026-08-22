import { describe, expect, it, vi } from 'vitest'

vi.mock('$service/appSettings', () => ({
	appSettings_store: {
		config: {
			branding: {
				name: 'نام سفارشی',
				tagline: 'شعار',
				heroTitle: 'عنوان',
				heroHighlight: 'برجسته',
				heroDescription: 'توضیح',
				heroImageAlt: 'تصویر',
				seoTitle: 'SEO',
				seoDescription: 'SEO description',
				revision: 'revision-2',
			},
		},
	},
}))

import { GET } from './+server'

describe('application manifest branding', () => {
	it('has a stable install identity and versioned icons', async () => {
		const response = await GET({} as never)
		const manifest = await response.json()

		expect(manifest.name).toBe('نام سفارشی')
		expect(manifest.id).toBe('/')
		expect(manifest.scope).toBe('/')
		expect(manifest.lang).toBe('fa')
		expect(manifest.dir).toBe('rtl')
		expect(manifest.icons[0].src).toContain('/branding/icon/192?v=revision-2')
		expect(manifest.icons[2]).toMatchObject({ sizes: '512x512', purpose: 'maskable' })
		expect(response.headers.get('cache-control')).toBe('no-cache')
		expect(response.headers.get('content-type')).toBe('application/manifest+json')
	})
})
