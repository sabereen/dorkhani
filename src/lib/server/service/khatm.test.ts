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
	tKhatmSeries: {
		findUnique: vi.fn(),
		findMany: vi.fn(),
		update: vi.fn(),
		updateMany: vi.fn(),
		delete: vi.fn(),
	},
	tKhatmDeletion: { create: vi.fn(), createMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
	tKhatmRecitation: { groupBy: vi.fn() },
	$transaction: vi.fn(),
}))

const statisticsMock = vi.hoisted(() => ({
	increment: vi.fn(),
	applyCommitted: vi.fn(),
}))

const notificationMock = vi.hoisted(() => ({ notify: vi.fn() }))

vi.mock('$lib/server/db', () => ({ db: dbMock }))
vi.mock('./statistics', () => ({
	statisticsService_increment: statisticsMock.increment,
	statisticsService_applyCommitted: statisticsMock.applyCommitted,
}))
vi.mock('./user-notification', () => ({ userNotification_notify: notificationMock.notify }))

import {
	KhatmFeaturedEligibilityError,
	KhatmFeaturedLimitError,
	KhatmFeaturedOrderError,
	KhatmHistoricalRoundError,
	KhatmOwnershipError,
	KhatmRangeLockedError,
	khatmService_claimGuestKhatms,
	khatmService_create,
	khatmService_delete,
	khatmService_edit,
	khatmService_getAutomaticShowcase,
	khatmService_getDeletionReason,
	khatmService_getDirectoryList,
	khatmService_getForEdit,
	khatmService_getFeaturedAdminList,
	khatmService_getPublicList,
	khatmService_reorderFeatured,
	khatmService_setFeatured,
	khatmService_setAsCompleted,
	khatmService_update,
} from './khatm'

const ownerActor = { kind: 'owner', ownerId: 'owner-1' } as const
const adminActor = { kind: 'admin' } as const

const baseKhatm = {
	id: 12,
	title: 'عنوان قبلی',
	description: 'توضیحات قبلی',
	rangeType: 'page' as const,
	versesRead: 0,
	pageProgress: 0,
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
	series: { id: 9, maxRounds: null, featuredOrder: null },
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
						OR: [{ seriesId: null }, { series: { is: { featuredOrder: null } } }],
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
				OR: [{ seriesId: null }, { series: { is: { featuredOrder: null } } }],
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

	it('keeps curated series out of the newest landing-page list', async () => {
		dbMock.tKhatm.findMany.mockResolvedValue([])

		await khatmService_getPublicList()

		expect(dbMock.tKhatm.findMany).toHaveBeenCalledWith({
			where: {
				private: false,
				reviewStatus: 'approved',
				AND: [
					{ OR: [{ seriesId: { not: null }, status: 'inProgress' }, { seriesId: null }] },
					{
						OR: [
							{ seriesId: null },
							{ series: { is: { featuredOrder: null } } },
						],
					},
				],
			},
			orderBy: { id: 'desc' },
			take: 20,
		})
	})
})

describe('curated featured khatms', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		dbMock.$transaction.mockImplementation(async (callback) => callback(dbMock))
		dbMock.tKhatm.findMany.mockResolvedValue([])
		dbMock.tKhatmSeries.findUnique.mockResolvedValue(null)
	})

	it('loads only eligible current rounds in their curated order', async () => {
		dbMock.tKhatm.findMany.mockResolvedValue([
			{ ...baseKhatm, id: 31, series: { id: 31, maxRounds: null, featuredOrder: 1 } },
			{ ...baseKhatm, id: 42, series: { id: 42, maxRounds: null, featuredOrder: 2 } },
		])

		await expect(khatmService_getFeaturedAdminList()).resolves.toMatchObject([
			{ khatm: { id: 31 }, featuredOrder: 1 },
			{ khatm: { id: 42 }, featuredOrder: 2 },
		])
		expect(dbMock.tKhatm.findMany).toHaveBeenCalledWith({
			include: { series: true },
			where: {
				private: false,
				reviewStatus: 'approved',
				status: 'inProgress',
				series: { is: { maxRounds: null, featuredOrder: { not: null } } },
			},
			orderBy: [{ series: { featuredOrder: 'asc' } }, { id: 'desc' }],
			take: 6,
		})
	})

	it('adds an eligible unlimited series at the end of the six available positions', async () => {
		dbMock.tKhatm.findUnique.mockResolvedValue({
			...baseKhatm,
			series: { id: 9, maxRounds: null, featuredOrder: null },
		})
		dbMock.tKhatmSeries.findMany.mockResolvedValue(
			Array.from({ length: 5 }, (_, index) => ({ id: index + 1 })),
		)

		await expect(khatmService_setFeatured(12, true)).resolves.toEqual([])
		expect(dbMock.tKhatmSeries.update).toHaveBeenCalledWith({
			where: { id: 9 },
			data: { featuredOrder: 6 },
		})
	})

	it('rejects a seventh selection and an ineligible khatm', async () => {
		dbMock.tKhatm.findUnique.mockResolvedValue({
			...baseKhatm,
			series: { id: 9, maxRounds: null, featuredOrder: null },
		})
		dbMock.tKhatmSeries.findMany.mockResolvedValue(
			Array.from({ length: 6 }, (_, index) => ({ id: index + 1 })),
		)
		await expect(khatmService_setFeatured(12, true)).rejects.toBeInstanceOf(
			KhatmFeaturedLimitError,
		)

		dbMock.tKhatm.findUnique.mockResolvedValue({
			...baseKhatm,
			private: true,
			series: { id: 9, maxRounds: null, featuredOrder: null },
		})
		await expect(khatmService_setFeatured(12, true)).rejects.toBeInstanceOf(
			KhatmFeaturedEligibilityError,
		)
	})

	it('removes a featured series and compacts every following position', async () => {
		dbMock.tKhatm.findUnique.mockResolvedValue({
			...baseKhatm,
			series: { id: 9, maxRounds: null, featuredOrder: 3 },
		})
		dbMock.tKhatmSeries.findUnique.mockResolvedValue({ featuredOrder: 3 })

		await khatmService_setFeatured(12, false)

		expect(dbMock.tKhatmSeries.update).toHaveBeenCalledWith({
			where: { id: 9 },
			data: { featuredOrder: null },
		})
		expect(dbMock.tKhatmSeries.updateMany).toHaveBeenCalledWith({
			where: { featuredOrder: { gt: 3 } },
			data: { featuredOrder: { decrement: 1 } },
		})
	})

	it('stores a complete manual order and rejects duplicate or stale input', async () => {
		dbMock.tKhatmSeries.findMany.mockResolvedValue([{ id: 9 }, { id: 4 }, { id: 7 }])

		await khatmService_reorderFeatured([7, 9, 4])
		expect(dbMock.tKhatmSeries.update).toHaveBeenNthCalledWith(1, {
			where: { id: 7 },
			data: { featuredOrder: 1 },
		})
		expect(dbMock.tKhatmSeries.update).toHaveBeenNthCalledWith(3, {
			where: { id: 4 },
			data: { featuredOrder: 3 },
		})

		await expect(khatmService_reorderFeatured([9, 9])).rejects.toBeInstanceOf(
			KhatmFeaturedOrderError,
		)
		dbMock.tKhatmSeries.findMany.mockResolvedValue([{ id: 9 }, { id: 4 }])
		await expect(khatmService_reorderFeatured([9, 7])).rejects.toBeInstanceOf(
			KhatmFeaturedOrderError,
		)
	})

	it('removes and compacts a featured series when its review status is rejected', async () => {
		dbMock.tKhatm.findUnique.mockResolvedValue(baseKhatm)
		dbMock.tKhatm.update.mockResolvedValue({ ...baseKhatm, reviewStatus: 'rejected' })
		dbMock.tKhatmSeries.findUnique.mockResolvedValue({ featuredOrder: 2 })

		await khatmService_update(12, { reviewStatus: 'rejected' })

		expect(dbMock.tKhatmSeries.update).toHaveBeenCalledWith({
			where: { id: 9 },
			data: { featuredOrder: null },
		})
		expect(dbMock.tKhatmSeries.updateMany).toHaveBeenCalledWith({
			where: { featuredOrder: { gt: 2 } },
			data: { featuredOrder: { decrement: 1 } },
		})
	})
})

describe('public khatm directory', () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it('combines search and range filters with progress ranking and a stable cursor', async () => {
		dbMock.tKhatm.findMany.mockResolvedValueOnce([
			{ ...baseKhatm, id: 50, pageProgress: 25.25 },
			{ ...baseKhatm, id: 49, pageProgress: 12.5 },
			{ ...baseKhatm, id: 48, pageProgress: 10.75 },
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
			orderBy: [{ pageProgress: 'desc' }, { id: 'desc' }],
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
						OR: [
							{ pageProgress: { lt: 12.5 } },
							{ pageProgress: 12.5, id: { lt: 49 } },
						],
					},
				],
			},
			orderBy: [{ pageProgress: 'desc' }, { id: 'desc' }],
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
			khatmService_edit(ownerActor, 12, {
				title: 'عنوان',
				description: '',
				rangeType: 'page',
				private: false,
				disableSeries: false,
			}),
		).rejects.toBeInstanceOf(KhatmOwnershipError)

		dbMock.tKhatm.findUnique.mockResolvedValueOnce({ ...baseKhatm, versesRead: 10 })
		await expect(
			khatmService_edit(adminActor, 12, {
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
			khatmService_edit(adminActor, 12, {
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

		await khatmService_edit(ownerActor, 12, {
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
		await khatmService_edit(ownerActor, 12, {
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
		await khatmService_edit(ownerActor, 12, {
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

		await expect(khatmService_delete(ownerActor, 12)).resolves.toBe(true)
		expect(dbMock.tKhatmDeletion.createMany).toHaveBeenCalledWith({
			data: [
				{ khatmId: 11, seriesId: 9, reason: 'owner' },
				{ khatmId: 12, seriesId: 9, reason: 'owner' },
			],
		})
		expect(dbMock.tKhatm.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [11, 12] } } })
		expect(dbMock.tKhatmSeries.delete).toHaveBeenCalledWith({ where: { id: 9 } })
	})

	it('lets an admin manage private and unowned khatms while preserving review status', async () => {
		const privateKhatm = {
			...baseKhatm,
			ownerId: null,
			private: true,
			reviewStatus: 'rejected' as const,
			seriesId: null,
			series: null,
		}
		dbMock.tKhatm.findUnique.mockResolvedValue(privateKhatm)

		await expect(khatmService_getForEdit(adminActor, 12)).resolves.toMatchObject({
			khatm: { id: 12, private: true, reviewStatus: 'rejected' },
		})
		await khatmService_edit(adminActor, 12, {
			title: 'عنوان ویرایش‌شده',
			description: privateKhatm.description,
			rangeType: privateKhatm.rangeType,
			private: false,
			disableSeries: false,
		})

		expect(dbMock.tKhatm.update).toHaveBeenLastCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ private: false, reviewStatus: 'rejected' }),
			}),
		)
	})

	it('records an admin tombstone when an admin deletes a khatm', async () => {
		dbMock.tKhatm.findUnique.mockResolvedValue({
			...baseKhatm,
			ownerId: 'someone-else',
			seriesId: null,
		})

		await expect(khatmService_delete(adminActor, 12)).resolves.toBe(true)
		expect(dbMock.tKhatmDeletion.createMany).toHaveBeenCalledWith({
			data: [{ khatmId: 12, seriesId: null, reason: 'admin' }],
		})
	})

	it('returns the recorded deletion reason for a khatm or series link', async () => {
		dbMock.tKhatmDeletion.findUnique.mockResolvedValue({ reason: 'expiredUnstarted' })
		dbMock.tKhatmDeletion.findFirst.mockResolvedValue({ reason: 'owner' })

		await expect(khatmService_getDeletionReason(12)).resolves.toBe('expiredUnstarted')
		await expect(khatmService_getDeletionReason(9, true)).resolves.toBe('owner')
		expect(dbMock.tKhatmDeletion.findUnique).toHaveBeenCalledWith({
			where: { khatmId: 12 },
			select: { reason: true },
		})
		expect(dbMock.tKhatmDeletion.findFirst).toHaveBeenCalledWith({
			where: { seriesId: 9 },
			select: { reason: true },
		})
	})

	it('copies ownership to a new round and respects a disabled series maximum', async () => {
		dbMock.tKhatm.findUnique.mockResolvedValue({
			...baseKhatm,
			ownerId: 'owner-1',
			guestClaimTokenHash: 'claim-hash',
		})
		await khatmService_setAsCompleted(12)
		expect(dbMock.tKhatm.updateMany).toHaveBeenCalledWith({
			where: { id: 12, status: 'inProgress' },
			data: { status: 'completed', endDate: expect.any(Date), pageProgress: 100 },
		})
		expect(dbMock.tKhatm.create).toHaveBeenCalledWith({
			data: expect.objectContaining({ ownerId: 'owner-1', guestClaimTokenHash: 'claim-hash', roundNumber: 3 }),
		})
		expect(notificationMock.notify).toHaveBeenCalledWith(
			'owner-1',
			expect.objectContaining({ type: 'roundCompleted', khatmId: 12, roundNumber: 2 }),
		)

		dbMock.tKhatm.create.mockClear()
		notificationMock.notify.mockClear()
		dbMock.tKhatm.findUnique.mockResolvedValue({
			...baseKhatm,
			series: { id: 9, maxRounds: null, featuredOrder: 2 },
		})
		await khatmService_setAsCompleted(12)
		expect(dbMock.tKhatm.create).toHaveBeenCalledWith({
			data: expect.objectContaining({ reviewStatus: 'approved', roundNumber: 3 }),
		})

		dbMock.tKhatm.create.mockClear()
		dbMock.tKhatm.findUnique.mockResolvedValue({
			...baseKhatm,
			series: { id: 9, maxRounds: 2, featuredOrder: null },
		})
		await khatmService_setAsCompleted(12)
		expect(dbMock.tKhatm.create).not.toHaveBeenCalled()
		expect(notificationMock.notify).toHaveBeenCalledWith(
			'owner-1',
			expect.objectContaining({ type: 'seriesCompleted', khatmId: 12, roundNumber: 2 }),
		)
	})

	it('records a user-created khatm but not an automatic continuation round as a creation', async () => {
		dbMock.tKhatm.create.mockResolvedValue({ ...baseKhatm, id: 20, roundNumber: 1 })

		await khatmService_create({
			title: 'ختم تازه',
			description: '',
			rangeType: 'free',
			private: false,
		})

		expect(statisticsMock.increment).toHaveBeenCalledOnce()
		expect(statisticsMock.increment).toHaveBeenCalledWith(
			dbMock,
			{ createdKhatms: 1 },
			expect.any(Date),
		)
		expect(statisticsMock.applyCommitted).toHaveBeenCalledWith(
			{ createdKhatms: 1 },
			expect.any(Date),
		)
	})

	it('does not update the statistics cache when creation fails', async () => {
		dbMock.$transaction.mockRejectedValueOnce(new Error('transaction failed'))

		await expect(
			khatmService_create({
				title: 'ختم ناموفق',
				description: '',
				rangeType: 'free',
				private: false,
			}),
		).rejects.toThrow('transaction failed')

		expect(statisticsMock.applyCommitted).not.toHaveBeenCalled()
	})

	it('does not count an already-completed round again', async () => {
		dbMock.tKhatm.findUnique.mockResolvedValue({ ...baseKhatm, status: 'completed' })

		await khatmService_setAsCompleted(12)

		expect(statisticsMock.increment).not.toHaveBeenCalled()
		expect(statisticsMock.applyCommitted).not.toHaveBeenCalled()
	})
})
