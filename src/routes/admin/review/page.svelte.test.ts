import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { KhatmData } from '$lib/entity/KhatmData'
import { Khatm } from '$lib/entity/Khatm.svelte'
import Page from './+page.svelte'

const featuredMock = vi.hoisted(() => ({
	getList: vi.fn(),
	set: vi.fn(),
	reorder: vi.fn(),
}))

vi.mock('$lib/entity/KhatmFeatured', () => ({
	featuredKhatm_getList: featuredMock.getList,
	featuredKhatm_set: featuredMock.set,
	featuredKhatm_reorder: featuredMock.reorder,
}))
vi.mock('$lib/components/TheToast.svelte', () => ({ toast: vi.fn() }))

const featuredKhatm = {
	id: 52,
	title: 'ختم شاخص آزمایشی',
	description: 'یک ختم دائمی برای آزمون پنل مدیریت',
	rangeType: 'page',
	versesRead: 20,
	pageProgress: 5,
	private: false,
	accessToken: null,
	created: new Date('2026-08-11T00:00:00Z'),
	endDate: null,
	status: 'inProgress',
	reviewStatus: 'approved',
	roundNumber: 2,
	seriesId: 40,
} satisfies KhatmData

describe('admin khatm review page', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.spyOn(Khatm, 'getAdminList').mockResolvedValue([])
		featuredMock.getList.mockResolvedValue({
			items: [{ khatm: featuredKhatm, featuredOrder: 1 }],
		})
	})

	it('shows the ordered featured panel with move and remove controls', async () => {
		render(Page)

		expect(await screen.findByRole('heading', { name: 'ختم‌های شاخص' })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'ختم شاخص آزمایشی' })).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'انتقال ختم شاخص آزمایشی به جایگاه بالاتر' }),
		).toBeDisabled()
		expect(
			screen.getByRole('button', { name: 'حذف ختم شاخص آزمایشی از ختم‌های شاخص' }),
		).toBeEnabled()
	})
})
