import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMock = vi.hoisted(() => ({
	tKhatm: {
		findUnique: vi.fn(),
		findFirst: vi.fn(),
		findMany: vi.fn(),
		update: vi.fn(),
		updateMany: vi.fn(),
		create: vi.fn(),
		deleteMany: vi.fn(),
	},
	tKhatmSeries: { update: vi.fn(), delete: vi.fn() },
	tKhatmDeletion: { createMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
	$transaction: vi.fn(),
}))

vi.mock('$lib/server/db', () => ({ db: dbMock }))

import {
	KhatmHistoricalRoundError,
	KhatmOwnershipError,
	KhatmRangeLockedError,
	khatmService_claimGuestKhatms,
	khatmService_deleteOwned,
	khatmService_editOwned,
	khatmService_setAsCompleted,
} from './khatm'

const baseKhatm = {
	id: 12,
	title: 'عنوان قبلی',
	description: 'توضیحات قبلی',
	rangeType: 'page' as const,
	versesRead: 0,
	private: false,
	accessToken: null,
	created: new Date('2026-01-01T00:00:00Z'),
	endDate: null,
	status: 'inProgress' as const,
	reviewStatus: 'approved' as const,
	roundNumber: 2,
	seriesId: 9,
	ownerId: 'owner-1',
	guestClaimTokenHash: null,
	_count: { parts: 0 },
	series: { id: 9, maxRounds: null },
}

describe('khatm ownership service', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		dbMock.$transaction.mockImplementation(async (callback) => callback(dbMock))
		dbMock.tKhatm.updateMany.mockResolvedValue({ count: 1 })
		dbMock.tKhatm.update.mockImplementation(async ({ data }) => ({ ...baseKhatm, ...data }))
	})

	it('claims every unowned round in a series only with the matching guest secret', async () => {
		const token = 'browser-only-secret'
		const hash = createHash('sha256').update(token).digest('hex')
		dbMock.tKhatm.findUnique.mockResolvedValue({
			...baseKhatm,
			ownerId: null,
			guestClaimTokenHash: hash,
		})

		await expect(khatmService_claimGuestKhatms('owner-2', [{ id: 12, token }])).resolves.toEqual([12])
		expect(dbMock.tKhatm.updateMany).toHaveBeenCalledWith({
			where: { seriesId: 9, ownerId: null, guestClaimTokenHash: hash },
			data: { ownerId: 'owner-2', guestClaimTokenHash: null },
		})
	})

	it('does not claim with a wrong token or take a khatm from another owner', async () => {
		const hash = createHash('sha256').update('correct').digest('hex')
		dbMock.tKhatm.findUnique
			.mockResolvedValueOnce({ ...baseKhatm, ownerId: null, guestClaimTokenHash: hash })
			.mockResolvedValueOnce({ ...baseKhatm, ownerId: 'someone-else', guestClaimTokenHash: hash })

		await expect(khatmService_claimGuestKhatms('owner-2', [{ id: 12, token: 'wrong' }])).resolves.toEqual([])
		await expect(khatmService_claimGuestKhatms('owner-2', [{ id: 12, token: 'correct' }])).resolves.toEqual([])
		expect(dbMock.tKhatm.updateMany).not.toHaveBeenCalled()
	})

	it('rejects editing by another owner and locks range type after participation', async () => {
		dbMock.tKhatm.findUnique.mockResolvedValueOnce({ ...baseKhatm, ownerId: 'someone-else' })
		await expect(
			khatmService_editOwned('owner-1', 12, {
				title: 'عنوان',
				description: '',
				rangeType: 'page',
				private: false,
				disableSeries: false,
			}),
		).rejects.toBeInstanceOf(KhatmOwnershipError)

		dbMock.tKhatm.findUnique.mockResolvedValueOnce({ ...baseKhatm, versesRead: 10 })
		await expect(
			khatmService_editOwned('owner-1', 12, {
				title: 'عنوان',
				description: '',
				rangeType: 'surah',
				private: false,
				disableSeries: false,
			}),
		).rejects.toBeInstanceOf(KhatmRangeLockedError)
	})

	it('preserves completed historical rounds when a newer series round exists', async () => {
		dbMock.tKhatm.findUnique.mockResolvedValue({ ...baseKhatm })
		dbMock.tKhatm.findFirst.mockResolvedValue({ id: 13 })

		await expect(
			khatmService_editOwned('owner-1', 12, {
				title: 'عنوان تازه',
				description: '',
				rangeType: 'page',
				private: false,
				disableSeries: false,
			}),
		).rejects.toBeInstanceOf(KhatmHistoricalRoundError)
		expect(dbMock.tKhatm.update).not.toHaveBeenCalled()
	})

	it('renews private access across the series and resets public review', async () => {
		dbMock.tKhatm.findUnique.mockResolvedValue({ ...baseKhatm })

		await khatmService_editOwned('owner-1', 12, {
			title: 'عنوان تازه',
			description: 'توضیحات تازه',
			rangeType: 'page',
			private: true,
			disableSeries: false,
		})

		const seriesUpdate = dbMock.tKhatm.updateMany.mock.calls[0][0]
		expect(seriesUpdate.where).toEqual({ seriesId: 9 })
		expect(seriesUpdate.data.private).toBe(true)
		expect(seriesUpdate.data.accessToken).toEqual(expect.any(String))

		dbMock.tKhatm.findUnique.mockResolvedValue({ ...baseKhatm, private: true, accessToken: 'old' })
		await khatmService_editOwned('owner-1', 12, {
			title: 'عنوان تازه',
			description: 'توضیحات تازه',
			rangeType: 'page',
			private: false,
			disableSeries: false,
		})
		expect(dbMock.tKhatm.update).toHaveBeenLastCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ accessToken: null, private: false, reviewStatus: 'pending' }),
			}),
		)
	})

	it('makes the current round the irreversible maximum when a series is disabled', async () => {
		dbMock.tKhatm.findUnique.mockResolvedValue({ ...baseKhatm })
		await khatmService_editOwned('owner-1', 12, {
			title: baseKhatm.title,
			description: baseKhatm.description,
			rangeType: baseKhatm.rangeType,
			private: false,
			disableSeries: true,
		})
		expect(dbMock.tKhatmSeries.update).toHaveBeenCalledWith({
			where: { id: 9 },
			data: { maxRounds: 2 },
		})
	})

	it('deletes every series round, records minimal tombstones, and removes the series', async () => {
		dbMock.tKhatm.findUnique.mockResolvedValue({ ...baseKhatm })
		dbMock.tKhatm.findMany.mockResolvedValue([{ id: 11 }, { id: 12 }])

		await expect(khatmService_deleteOwned('owner-1', 12)).resolves.toBe(true)
		expect(dbMock.tKhatmDeletion.createMany).toHaveBeenCalledWith({
			data: [
				{ khatmId: 11, seriesId: 9 },
				{ khatmId: 12, seriesId: 9 },
			],
		})
		expect(dbMock.tKhatm.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [11, 12] } } })
		expect(dbMock.tKhatmSeries.delete).toHaveBeenCalledWith({ where: { id: 9 } })
	})

	it('copies ownership to a new round and respects a disabled series maximum', async () => {
		dbMock.tKhatm.update.mockResolvedValue({
			...baseKhatm,
			status: 'completed',
			ownerId: 'owner-1',
			guestClaimTokenHash: 'claim-hash',
		})
		await khatmService_setAsCompleted(12)
		expect(dbMock.tKhatm.create).toHaveBeenCalledWith({
			data: expect.objectContaining({ ownerId: 'owner-1', guestClaimTokenHash: 'claim-hash', roundNumber: 3 }),
		})

		dbMock.tKhatm.create.mockClear()
		dbMock.tKhatm.update.mockResolvedValue({
			...baseKhatm,
			status: 'completed',
			series: { id: 9, maxRounds: 2 },
		})
		await khatmService_setAsCompleted(12)
		expect(dbMock.tKhatm.create).not.toHaveBeenCalled()
	})
})
