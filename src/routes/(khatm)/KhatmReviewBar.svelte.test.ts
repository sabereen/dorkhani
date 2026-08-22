import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import type { ReviewStatus } from '@prisma-client'
import type { KhatmData } from '$lib/entity/KhatmData'
import { Khatm } from '$lib/entity/Khatm.svelte'
import KhatmReviewBar from './KhatmReviewBar.svelte'

const toastMock = vi.hoisted(() => vi.fn())
const featuredMock = vi.hoisted(() => vi.fn())
vi.mock('$lib/components/TheToast.svelte', () => ({ toast: toastMock }))
vi.mock('$lib/entity/KhatmFeatured', () => ({ featuredKhatm_set: featuredMock }))

function createKhatm(id: number, reviewStatus: ReviewStatus, seriesId: number | null = null) {
	return Khatm.fromPlain({
		id,
		title: 'ختم آزمایشی',
		description: '',
		rangeType: 'page',
		versesRead: 0,
		pageProgress: 0,
		private: false,
		accessToken: null,
		created: new Date('2026-08-11T00:00:00Z'),
		endDate: null,
		status: 'inProgress',
		reviewStatus,
		roundNumber: 1,
		seriesId,
	} satisfies KhatmData)
}

describe('KhatmReviewBar', () => {
	it('shows actions based on the current review status', () => {
		const khatm = createKhatm(1001, 'approved')

		render(KhatmReviewBar, { props: { khatm } })

		expect(screen.getByText('تأییدشده')).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'تأیید ختم' })).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'رد ختم' })).toBeInTheDocument()
	})

	it('disables both pending actions while a review request is running', async () => {
		const khatm = createKhatm(1002, 'pending')
		let finishRequest: (() => void) | undefined
		vi.spyOn(khatm, 'update').mockReturnValue(
			new Promise<void>((resolve) => {
				finishRequest = resolve
			}) as ReturnType<Khatm['update']>,
		)
		render(KhatmReviewBar, { props: { khatm } })

		await fireEvent.click(screen.getByRole('button', { name: 'تأیید ختم' }))

		expect(screen.getByRole('button', { name: 'در حال ثبت…' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'رد ختم' })).toBeDisabled()
		finishRequest?.()
		await waitFor(() => expect(screen.getByText('ختم تأیید شد.')).toBeInTheDocument())
	})

	it('announces an API error and keeps the current status', async () => {
		const khatm = createKhatm(1003, 'rejected')
		vi.spyOn(khatm, 'update').mockRejectedValue(new Error('خطای بررسی'))
		render(KhatmReviewBar, { props: { khatm } })

		await fireEvent.click(screen.getByRole('button', { name: 'تأیید ختم' }))

		expect(await screen.findByText('خطای بررسی')).toBeInTheDocument()
		expect(screen.getByText('ردشده')).toBeInTheDocument()
		expect(toastMock).toHaveBeenCalledWith('error', 'خطای بررسی')
	})

	it('adds an eligible permanent khatm to the featured showcase', async () => {
		const khatm = createKhatm(1004, 'approved', 44)
		featuredMock.mockResolvedValue({
			items: [{ khatm: khatm.plain, featuredOrder: 2 }],
		})
		render(KhatmReviewBar, {
			props: { khatm, featuredOrder: null, canFeature: true },
		})

		await fireEvent.click(screen.getByRole('button', { name: 'افزودن به شاخص‌ها' }))

		expect(featuredMock).toHaveBeenCalledWith(1004, true)
		expect(await screen.findByText('جایگاه ۲ از فهرست صفحهٔ اصلی')).toBeInTheDocument()
		expect(toastMock).toHaveBeenCalledWith('info', 'ختم به فهرست شاخص‌ها افزوده شد.')
	})
})
