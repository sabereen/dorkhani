import { describe, test, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/svelte'
import Page from './+page.svelte'
import { DEFAULT_BRANDING_CONFIG, getPublicBranding } from '$lib/entity/Branding'
import * as m from '$lib/paraglide/messages.js'

const testLocale = 'fa' as const
const numberFormatter = new Intl.NumberFormat('fa-IR')

const featuredKhatmText = {
	fa: {
		title: 'ختم دائمی برای سلامتی',
		description: 'همراهی ماندگار برای نیت سلامتی',
	},
	ar: {
		title: 'ختمة دائمة من أجل الصحة',
		description: 'رفقة مستمرة بنية الصحة والعافية',
	},
	en: {
		title: 'A permanent khatm for wellbeing',
		description: 'Lasting companionship with the intention of wellbeing',
	},
} as const

const customBranding = {
	...DEFAULT_BRANDING_CONFIG,
	texts: {
		...DEFAULT_BRANDING_CONFIG.texts,
		fa: {
			...DEFAULT_BRANDING_CONFIG.texts.fa,
			heroTitle: 'عنوان سفارشی',
			heroHighlight: 'بخش برجسته',
			heroDescription: 'توضیح سفارشی Hero',
		},
		ar: {
			...DEFAULT_BRANDING_CONFIG.texts.ar,
			heroTitle: 'عنوان مخصص',
			heroHighlight: 'قسم بارز',
			heroDescription: 'وصف مخصص Hero',
		},
		en: {
			...DEFAULT_BRANDING_CONFIG.texts.en,
			heroTitle: 'Custom title',
			heroHighlight: 'Featured section',
			heroDescription: 'Custom Hero description',
		},
	},
}

describe('/+page.svelte', () => {
	const data = {
		khatms: [],
		featuredKhatms: [],
		showcase: [],
		zekrList: [],
		statistics: {
			totals: { recitedAyahs: 12345, completedRounds: 17 },
			daily: Array.from({ length: 7 }, (_, index) => ({
				date: `2026-08-${String(index + 5).padStart(2, '0')}`,
				recitedAyahs: index * 10,
				createdKhatms: index,
				completedRounds: index % 2,
			})),
		},
		branding: getPublicBranding(DEFAULT_BRANDING_CONFIG),
	}

	test('renders the landing page and its aggregated statistics', () => {
		render(Page, { props: { data } } as never)
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
		expect(
			screen.getByRole('heading', { name: m.home_statistics_title() }),
		).toBeInTheDocument()
		expect(screen.getByText(numberFormatter.format(12345))).toBeInTheDocument()
		expect(screen.getByText(numberFormatter.format(17))).toBeInTheDocument()
		const dailyList = screen.getByRole('list', { name: m.home_statistics_daily_label() })
		expect(within(dailyList).getAllByRole('listitem')).toHaveLength(7)
		expect(screen.queryByRole('heading', { name: m.home_featured_title() })).not.toBeInTheDocument()
	})

	test('renders the permanent featured showcase when curated khatms exist', () => {
		const featuredKhatm = {
			id: 44,
			title: featuredKhatmText[testLocale].title,
			description: featuredKhatmText[testLocale].description,
			rangeType: 'page',
			versesRead: 120,
			pageProgress: 12,
			private: false,
			accessToken: null,
			created: new Date('2026-08-01T00:00:00Z'),
			endDate: null,
			status: 'inProgress',
			reviewStatus: 'approved',
			roundNumber: 4,
			seriesId: 44,
		}

		render(Page, {
			props: { data: { ...data, featuredKhatms: [featuredKhatm] } },
		} as never)

		expect(screen.getByRole('heading', { name: m.home_featured_title() })).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: featuredKhatmText[testLocale].title }),
		).toBeInTheDocument()
	})

	test('renders configured hero branding', () => {
		render(Page, {
			props: {
				data: {
					...data,
					branding: getPublicBranding(customBranding, testLocale),
				},
			},
		} as never)

		expect(
			screen.getByRole('heading', { name: customBranding.texts[testLocale].heroTitle }),
		).toBeInTheDocument()
		expect(screen.getByText(customBranding.texts[testLocale].heroDescription)).toBeInTheDocument()
	})
})














