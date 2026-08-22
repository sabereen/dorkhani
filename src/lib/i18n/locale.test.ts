import { describe, expect, it, vi } from 'vitest'
import {
	findPreferredArabicLocale,
	resolveClientLocale,
	resolveRequestLocale,
} from './locale'

describe('locale resolution', () => {
	it('forces admin to Persian', () => {
		expect(
			resolveRequestLocale({
				pathname: '/en/admin/review',
				cookieLocale: 'en',
				accountLocale: 'ar',
			}),
		).toMatchObject({ locale: 'fa', source: 'admin', needsLocaleChoice: false })
		expect(
			resolveRequestLocale({ pathname: '/api/admin/ai/test', cookieLocale: 'en' }),
		).toMatchObject({ locale: 'fa', source: 'admin' })
	})

	it('uses cookie, account, and URL in priority order', () => {
		expect(
			resolveRequestLocale({ pathname: '/en/list', cookieLocale: 'ar', accountLocale: 'en' }),
		).toMatchObject({ locale: 'ar', source: 'cookie' })
		expect(resolveRequestLocale({ pathname: '/en/list', accountLocale: 'fa' })).toMatchObject({
			locale: 'fa',
			source: 'account',
		})
		expect(resolveRequestLocale({ pathname: '/en/list' })).toMatchObject({
			locale: 'en',
			source: 'url',
		})
	})

	it('prefers Persian over Arabic regardless of browser order', () => {
		expect(findPreferredArabicLocale(['ar-SA', 'en', 'fa-IR'])).toBe('fa')
		expect(findPreferredArabicLocale(['en', 'ar'])).toBe('ar')
	})

	it('marks an unknown request as unresolved', () => {
		expect(resolveRequestLocale({ pathname: '/', acceptLanguage: 'en-US,en;q=0.9' })).toEqual({
			locale: 'fa',
			source: 'fallback',
			needsLocaleChoice: true,
		})
	})

	it('uses Iran and Afghanistan timezones only after browser languages', () => {
		vi.stubGlobal('navigator', { languages: ['en-US'], language: 'en-US' })
		const resolvedOptions = vi
			.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
			.mockReturnValue({ timeZone: 'Asia/Tehran' } as Intl.ResolvedDateTimeFormatOptions)
		expect(resolveClientLocale()).toBe('fa')
		resolvedOptions.mockRestore()
		vi.unstubAllGlobals()
	})
})
