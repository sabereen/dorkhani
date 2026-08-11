import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMock = vi.hoisted(() => ({
	getBySeriesRecord: vi.fn(),
	getDeletionReason: vi.fn(),
	getFullRecord: vi.fn(),
	toPublic: vi.fn(),
}))

vi.mock('$service/khatm', () => ({
	khatmService_getBySeriesRecord: serviceMock.getBySeriesRecord,
	khatmService_getDeletionReason: serviceMock.getDeletionReason,
	khatmService_getFullRecord: serviceMock.getFullRecord,
	khatmService_toPublic: serviceMock.toPublic,
}))

import { load } from './+layout.server'

function loadKhatm() {
	return load({
		params: { khatm: 'k12' },
		url: new URL('http://localhost/k12'),
		locals: { user: null },
	} as never)
}

describe('deleted khatm page', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		serviceMock.getFullRecord.mockResolvedValue(null)
	})

	it('returns 410 with the deletion message for a tombstoned id', async () => {
		serviceMock.getDeletionReason.mockResolvedValue('owner')

		await expect(loadKhatm()).rejects.toMatchObject({
			status: 410,
			body: { message: 'این ختم توسط سازنده حذف شده است.', type: 'khatm-deleted' },
		})
	})

	it('returns 410 with the expiry message for an automatically removed khatm', async () => {
		serviceMock.getDeletionReason.mockResolvedValue('expiredUnstarted')

		await expect(loadKhatm()).rejects.toMatchObject({
			status: 410,
			body: {
				message: 'این ختم به‌دلیل آغاز نشدن در مهلت تعیین‌شده، به‌صورت خودکار حذف شده است.',
				type: 'khatm-expired',
			},
		})
	})

	it('keeps returning 404 for an id that never existed', async () => {
		serviceMock.getDeletionReason.mockResolvedValue(null)
		await expect(loadKhatm()).rejects.toMatchObject({ status: 404 })
	})
})
