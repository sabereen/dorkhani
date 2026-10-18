import type { BrowserContext } from '@playwright/test'
import data from './fixtures.json' with { type: 'json' }
import { ayat, silentAudio } from './quran'

export async function prepareContext(
	context: BrowserContext,
	options: { locale: string; theme: string; scenario: string },
) {
	await context.addInitScript(({ locale, theme }) => {
		localStorage.setItem(
			'app_v1_localSettings',
			JSON.stringify({
				locale,
				colorScheme: theme,
				quranFont: 'hafs',
			}),
		)
		document.cookie = `PARAGLIDE_LOCALE=${locale};path=/`
	}, options)
	await context.route('**/*', async (route) => {
		const request = route.request()
		const url = new URL(request.url())
		if (url.pathname.endsWith('.mp3')) {
			await route.fulfill({ contentType: 'audio/wav', body: silentAudio() })
			return
		}
		if (url.pathname.startsWith('/og/')) {
			await route.fulfill({
				contentType: 'image/svg+xml',
				headers: { 'access-control-allow-origin': '*' },
				body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#176b55"/><rect x="60" y="60" width="1080" height="510" rx="30" fill="#dcefe7"/></svg>',
			})
			return
		}
		if (!url.pathname.startsWith('/api/')) {
			if (url.hostname === '127.0.0.1') await route.continue()
			else await route.abort()
			return
		}
		const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
		if (request.method() === 'OPTIONS') {
			await route.fulfill({ status: 204, headers })
			return
		}
		let body: unknown = {}
		switch (url.pathname) {
			case '/api/quran/range':
				body = { ayat, rangeParam: '1:1-1:3' }
				break
			case '/api/app/bootstrap':
				body = {
					locale: options.locale,
					needsLocaleChoice: false,
					branding: data.branding,
					supportLink: 'https://example.com/support',
					user: ['login', 'register', 'forgot', 'reset', 'validation', 'login-loading'].includes(
						options.scenario,
					)
						? null
						: { id: 'visual-user', name: 'کاربر آزمایشی', image: null, locale: options.locale },
					authProviders: { google: false, eitaa: false, bale: false, soroush: false },
					miniAppUrls: { bale: null, eitaa: null, soroush: null },
				}
				break
			case '/api/home':
				body = data.home
				break
			case '/api/khatm/directory':
				body = { list: data.khatms, nextCursor: null }
				break
			case '/api/khatm/page':
				body = {
					khatm: {
						...(url.searchParams.get('resource')?.startsWith('a')
							? data.khatms[1]
							: data.khatms[0]),
						parts: data.parts,
					},
					isAuthenticated: true,
					isAdmin: false,
					isOwner: true,
					canEdit: true,
					canStopSeries: false,
					seriesMaxRounds: null,
					featuredOrder: null,
					canFeature: false,
				}
				break
			case '/api/account':
				body = data.account
				break
			case '/api/account/khatms/1':
				body = {
					khatm: data.khatms[0],
					canChangeRange: true,
					canDisableSeries: true,
					isAdmin: false,
				}
				break
			case '/api/zekr/3':
				body = { zekr: data.zekr }
				break
			case '/api/khatm/create':
				body = { khatm: data.khatms[0] }
				break
			case '/api/auth/get-session':
				body = null
				break
			case '/api/khatm/claim':
				body = { acceptedIds: [] }
				break
			case '/api/zekr/pick':
			case '/api/auth/sign-in/email':
				// Keep loading states observable until the context is disposed.
				return
		}
		await route.fulfill({ json: body, headers })
	})
}
