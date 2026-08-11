import { describe, test, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/svelte'
import Page from './+page.svelte'

describe('/+page.svelte', () => {
	const data = {
		khatms: [],
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
		expect(screen.getByRole('heading', { name: 'هر تلاوت، بخشی از یک جریان زنده' })).toBeInTheDocument()
		expect(screen.getByText('۱۲٬۳۴۵')).toBeInTheDocument()
		expect(screen.getByText('۱۷')).toBeInTheDocument()
		const dailyList = screen.getByRole('list', { name: 'آمار فعالیت هفت روز اخیر' })
		expect(within(dailyList).getAllByRole('listitem')).toHaveLength(7)
	})
})
