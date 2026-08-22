import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMock = vi.hoisted(() => ({
	getDeletionReason: vi.fn(),
	getFull: vi.fn(),
}))

vi.mock('$service/khatm', () => ({
	khatmService_getDeletionReason: serviceMock.getDeletionReason,
	khatmService_getFull: serviceMock.getFull,
}))

import { GET } from './+server'

describe('expired khatm API response', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		serviceMock.getFull.mockResolvedValue(null)
	})

	it('returns an expiry-specific 410 response', async () => {
		serviceMock.getDeletionReason.mockResolvedValue('expiredUnstarted')

		await expect(
			GET({ url: new URL('http://localhost/api/khatm?khatmId=12') } as never),
		).rejects.toMatchObject({
			status: 410,
			body: {
				message: 'این ختم به‌دلیل آغاز نشدن در مهلت تعیین‌شده، به‌صورت خودکار حذف شده است.',
				type: 'khatm-expired',
			},
		})
	})
})
