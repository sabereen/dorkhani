import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMock = vi.hoisted(() => ({
	tKhatm: {
		findMany: vi.fn(),
		deleteMany: vi.fn(),
	},
	tKhatmDeletion: { create: vi.fn() },
	tKhatmSeries: { deleteMany: vi.fn() },
	$transaction: vi.fn(),
}))

vi.mock('$lib/server/db', () => ({ db: dbMock }))
vi.mock('./appSettings', () => ({
	appSettings_store: { config: { staleKhatmRetentionDays: 30 } },
}))

import { khatmCleanup_deleteExpiredUnstarted } from './khatmCleanup'

describe('expired unstarted khatm cleanup', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		dbMock.$transaction.mockImplementation(async (callback) => callback(dbMock))
		dbMock.tKhatm.deleteMany.mockResolvedValue({ count: 1 })
		dbMock.tKhatmSeries.deleteMany.mockResolvedValue({ count: 1 })
	})

	it('removes expired independent khatms and first series rounds in a transaction', async () => {
		dbMock.tKhatm.findMany.mockResolvedValue([
			{ id: 11, seriesId: null },
			{ id: 12, seriesId: 12 },
		])

		await expect(
			khatmCleanup_deleteExpiredUnstarted({
				now: new Date('2026-08-11T12:00:00Z'),
				retentionDays: 30,
			}),
		).resolves.toEqual({ count: 2 })

		const eligibility = {
			status: 'inProgress',
			versesRead: 0,
			created: { lte: new Date('2026-07-12T12:00:00Z') },
			OR: [{ seriesId: null }, { roundNumber: 1 }],
		}
		expect(dbMock.tKhatm.findMany).toHaveBeenCalledWith({
			where: { ...eligibility, id: { gt: 0 } },
			select: { id: true, seriesId: true },
			orderBy: { id: 'asc' },
			take: 100,
		})
		expect(dbMock.tKhatm.deleteMany).toHaveBeenNthCalledWith(1, {
			where: { ...eligibility, id: 11 },
		})
		expect(dbMock.tKhatmDeletion.create).toHaveBeenNthCalledWith(1, {
			data: { khatmId: 11, seriesId: null, reason: 'expiredUnstarted' },
		})
		expect(dbMock.tKhatmDeletion.create).toHaveBeenNthCalledWith(2, {
			data: { khatmId: 12, seriesId: 12, reason: 'expiredUnstarted' },
		})
		expect(dbMock.tKhatmSeries.deleteMany).toHaveBeenCalledOnce()
		expect(dbMock.tKhatmSeries.deleteMany).toHaveBeenCalledWith({
			where: { id: 12, khatms: { none: {} } },
		})
	})

	it('does not create a tombstone when the khatm starts before the guarded delete', async () => {
		dbMock.tKhatm.findMany.mockResolvedValue([{ id: 11, seriesId: null }])
		dbMock.tKhatm.deleteMany.mockResolvedValue({ count: 0 })

		await expect(khatmCleanup_deleteExpiredUnstarted()).resolves.toEqual({ count: 0 })
		expect(dbMock.tKhatmDeletion.create).not.toHaveBeenCalled()
		expect(dbMock.tKhatmSeries.deleteMany).not.toHaveBeenCalled()
	})
})
