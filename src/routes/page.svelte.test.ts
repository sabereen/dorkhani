import { describe, test, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/svelte'
import Page from './+page.svelte'

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
	}

	test('renders the landing page and its aggregated statistics', () => {
		render(Page, { props: { data } } as never)
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
		expect(
			screen.getByRole('heading', { name: 'هر تلاوت، بخشی از یک جریان زنده' }),
		).toBeInTheDocument()
		expect(screen.getByText('۱۲٬۳۴۵')).toBeInTheDocument()
		expect(screen.getByText('۱۷')).toBeInTheDocument()
		const dailyList = screen.getByRole('list', { name: 'آمار فعالیت هفت روز اخیر' })
		expect(within(dailyList).getAllByRole('listitem')).toHaveLength(7)
		expect(screen.queryByRole('heading', { name: 'ختم‌های شاخص' })).not.toBeInTheDocument()
	})

	test('renders the permanent featured showcase when curated khatms exist', () => {
		const featuredKhatm = {
			id: 44,
			title: 'ختم دائمی برای سلامتی',
			description: 'همراهی ماندگار برای نیت سلامتی',
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

		expect(screen.getByRole('heading', { name: 'ختم‌های شاخص' })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'ختم دائمی برای سلامتی' })).toBeInTheDocument()
	})
})
