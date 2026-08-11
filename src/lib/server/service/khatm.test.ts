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
	tKhatmRecitation: { groupBy: vi.fn() },
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
	khatmService_getAutomaticShowcase,
	khatmService_getDirectoryList,
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

describe('automatic khatm showcase', () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it('ranks up to six eligible khatms by progress in the previous 72 hours', async () => {
		const now = new Date('2026-08-11T12:00:00Z')
		const latest = new Date('2026-08-11T10:00:00Z')
		dbMock.tKhatmRecitation.groupBy.mockResolvedValue([
			{ khatmId: 31, _sum: { verseCount: 200 }, _max: { created: latest } },
			{ khatmId: 29, _sum: { verseCount: 200 }, _max: { created: latest } },
			{ khatmId: 17, _sum: { verseCount: 150 }, _max: { created: latest } },
		])
		dbMock.tKhatm.findMany.mockResolvedValue([
			{ ...baseKhatm, id: 17 },
			{ ...baseKhatm, id: 31 },
			{ ...baseKhatm, id: 29 },
		])

		const result = await khatmService_getAutomaticShowcase({ now })

		expect(dbMock.tKhatmRecitation.groupBy).toHaveBeenCalledWith({
			by: ['khatmId'],
			where: {
				created: { gte: new Date('2026-08-08T12:00:00Z') },
				khatm: {
					is: {
						private: false,
						reviewStatus: 'approved',
						status: 'inProgress',
					},
				},
			},
			_sum: { verseCount: true },
			_max: { created: true },
			orderBy: [
				{ _sum: { verseCount: 'desc' } },
				{ _max: { created: 'desc' } },
				{ khatmId: 'desc' },
			],
			take: 6,
		})
		expect(dbMock.tKhatm.findMany).toHaveBeenCalledWith({
			where: {
				id: { in: [31, 29, 17] },
				private: false,
				reviewStatus: 'approved',
				status: 'inProgress',
			},
		})
		expect(result.map((khatm) => khatm.id)).toEqual([31, 29, 17])
		expect(result[0]).not.toHaveProperty('ownerId')
		expect(result[0]).not.toHaveProperty('guestClaimTokenHash')
	})

	it('returns a shorter list when progress is zero or a ranked khatm is no longer eligible', async () => {
		dbMock.tKhatmRecitation.groupBy.mockResolvedValue([
			{ khatmId: 31, _sum: { verseCount: 10 }, _max: { created: new Date() } },
			{ khatmId: 29, _sum: { verseCount: 0 }, _max: { created: new Date() } },
		])
		dbMock.tKhatm.findMany.mockResolvedValue([])

		await expect(khatmService_getAutomaticShowcase()).resolves.toEqual([])
		expect(dbMock.tKhatm.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: expect.objectContaining({ id: { in: [31] } }) }),
		)
	})
})

describe('public khatm directory', () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it('combines search and range filters with progress ranking and a stable cursor', async () => {
		dbMock.tKhatm.findMany.mockResolvedValueOnce([
			{ ...baseKhatm, id: 50, versesRead: 100 },
			{ ...baseKhatm, id: 49, versesRead: 100 },
			{ ...baseKhatm, id: 48, versesRead: 90 },
		])

		const firstPage = await khatmService_getDirectoryList(
			{ view: 'progress', q: 'شفا', rangeType: 'page' },
			{ limit: 2 },
		)

		expect(dbMock.tKhatm.findMany).toHaveBeenCalledWith({
			where: {
				private: false,
				reviewStatus: 'approved',
				rangeType: 'page',
				OR: [{ title: { contains: 'شفا' } }, { description: { contains: 'شفا' } }],
				status: 'inProgress',
			},
			orderBy: [{ versesRead: 'desc' }, { id: 'desc' }],
			take: 3,
		})
		expect(firstPage.list.map((khatm) => khatm.id)).toEqual([50, 49])
		expect(firstPage.nextCursor).toEqual(expect.any(String))
		expect(firstPage.list[0]).not.toHaveProperty('ownerId')

		dbMock.tKhatm.findMany.mockResolvedValueOnce([])
		await khatmService_getDirectoryList(
			{
				view: 'progress',
				q: 'شفا',
				rangeType: 'page',
				cursor: firstPage.nextCursor || undefined,
			},
			{ limit: 2 },
		)

		expect(dbMock.tKhatm.findMany).toHaveBeenLastCalledWith({
			where: {
				private: false,
				reviewStatus: 'approved',
				rangeType: 'page',
				OR: [{ title: { contains: 'شفا' } }, { description: { contains: 'شفا' } }],
				status: 'inProgress',
				AND: [
					{
						OR: [{ versesRead: { lt: 100 } }, { versesRead: 100, id: { lt: 49 } }],
					},
				],
			},
			orderBy: [{ versesRead: 'desc' }, { id: 'desc' }],
			take: 3,
		})
	})

	it('shows only the current round of unlimited series ordered by completed rounds', async () => {
		dbMock.tKhatm.findMany.mockResolvedValue([])

		await khatmService_getDirectoryList({ view: 'continuous', q: '' })

		expect(dbMock.tKhatm.findMany).toHaveBeenCalledWith({
			where: {
				private: false,
				reviewStatus: 'approved',
				status: 'inProgress',
				series: { is: { maxRounds: null } },
			},
			orderBy: [{ roundNumber: 'desc' }, { id: 'desc' }],
			take: 41,
		})
	})

	it('keeps the default directory ordered by newest id', async () => {
		dbMock.tKhatm.findMany.mockResolvedValue([])

		await khatmService_getDirectoryList({ view: 'recent', q: '' })

		expect(dbMock.tKhatm.findMany).toHaveBeenCalledWith({
			where: { private: false, reviewStatus: 'approved' },
			orderBy: [{ id: 'desc' }],
			take: 41,
		})
	})
})

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
		dbMock.tKhatm.findUnique.mockResolvedValue({
			...baseKhatm,
			ownerId: 'owner-1',
			guestClaimTokenHash: 'claim-hash',
		})
		await khatmService_setAsCompleted(12)
		expect(dbMock.tKhatm.create).toHaveBeenCalledWith({
			data: expect.objectContaining({ ownerId: 'owner-1', guestClaimTokenHash: 'claim-hash', roundNumber: 3 }),
		})

		dbMock.tKhatm.create.mockClear()
		dbMock.tKhatm.findUnique.mockResolvedValue({
			...baseKhatm,
			series: { id: 9, maxRounds: 2 },
		})
		await khatmService_setAsCompleted(12)
		expect(dbMock.tKhatm.create).not.toHaveBeenCalled()
	})
})
