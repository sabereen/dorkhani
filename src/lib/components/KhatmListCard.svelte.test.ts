import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import type { KhatmData } from '$lib/entity/KhatmData'
import { Khatm } from '$lib/entity/Khatm.svelte'
import KhatmListCard from './KhatmListCard.svelte'

describe('KhatmListCard', () => {
	it('renders persisted page-based progress', () => {
		const khatm = Khatm.fromPlain({
			id: 912,
			title: 'ختم آزمایشی',
			description: '',
			rangeType: 'free',
			versesRead: 100,
			pageProgress: 12.345,
			private: false,
			accessToken: null,
			created: new Date('2026-08-11T00:00:00Z'),
			endDate: null,
			status: 'inProgress',
			reviewStatus: 'approved',
			roundNumber: 1,
			seriesId: null,
		} satisfies KhatmData)

		render(KhatmListCard, { props: { khatm } })

		expect(screen.getByText(`${khatm.percent.toLocaleString('fa')}٪`)).toBeInTheDocument()
		expect(screen.getByRole('progressbar')).toHaveValue(12.35)
	})
})
