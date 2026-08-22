import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMock = vi.hoisted(() => ({
	tSystemStatistics: { findUnique: vi.fn() },
	tDailyStatistics: { findMany: vi.fn() },
}))

vi.mock('$lib/server/db', () => ({ db: dbMock }))

import {
	statisticsService_applyCommitted,
	statisticsService_getLandingStatistics,
	statisticsService_getTehranDay,
	statisticsService_increment,
	statisticsService_resetCache,
} from './statistics'

const now = new Date('2026-08-11T12:00:00.000Z')

describe('landing statistics cache', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		statisticsService_resetCache()
		dbMock.tSystemStatistics.findUnique.mockResolvedValue({
			totalRecitedAyahs: BigInt(1200),
			totalCompletedRounds: BigInt(8),
		})
		dbMock.tDailyStatistics.findMany.mockResolvedValue([
			{
				day: new Date('2026-08-11T00:00:00.000Z'),
				recitedAyahs: BigInt(45),
				createdKhatms: BigInt(2),
				completedRounds: BigInt(1),
			},
		])
	})

	it('coalesces concurrent cold reads and serves later reads from memory', async () => {
		const [first, second] = await Promise.all([
			statisticsService_getLandingStatistics(now),
			statisticsService_getLandingStatistics(now),
		])
		const warm = await statisticsService_getLandingStatistics(now)

		expect(first).toEqual(second)
		expect(warm).toBe(first)
		expect(dbMock.tSystemStatistics.findUnique).toHaveBeenCalledOnce()
		expect(dbMock.tDailyStatistics.findMany).toHaveBeenCalledOnce()
		expect(first.daily).toHaveLength(7)
		expect(first.daily.at(-1)).toEqual({
			date: '2026-08-11',
			recitedAyahs: 45,
			createdKhatms: 2,
			completedRounds: 1,
		})
	})

	it('updates a warm cache after a committed change without another query', async () => {
		await statisticsService_getLandingStatistics(now)
		statisticsService_applyCommitted(
			{ recitedAyahs: 12, createdKhatms: 1, completedRounds: 1 },
			now,
		)

		const result = await statisticsService_getLandingStatistics(now)

		expect(result.totals).toEqual({ recitedAyahs: 1212, completedRounds: 9 })
		expect(result.daily.at(-1)).toEqual({
			date: '2026-08-11',
			recitedAyahs: 57,
			createdKhatms: 3,
			completedRounds: 2,
		})
		expect(dbMock.tSystemStatistics.findUnique).toHaveBeenCalledOnce()
	})

	it('retries a cold read when a commit happens while it is loading', async () => {
		let resolveFirstRead: (value: unknown) => void = () => undefined
		const firstRead = new Promise((resolve) => {
			resolveFirstRead = resolve
		})
		dbMock.tSystemStatistics.findUnique.mockReturnValueOnce(firstRead).mockResolvedValueOnce({
			totalRecitedAyahs: BigInt(1212),
			totalCompletedRounds: BigInt(8),
		})
		dbMock.tDailyStatistics.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
			{
				day: new Date('2026-08-11T00:00:00.000Z'),
				recitedAyahs: BigInt(12),
				createdKhatms: BigInt(0),
				completedRounds: BigInt(0),
			},
		])

		const loading = statisticsService_getLandingStatistics(now)
		statisticsService_applyCommitted({ recitedAyahs: 12 }, now)
		resolveFirstRead({
			totalRecitedAyahs: BigInt(1200),
			totalCompletedRounds: BigInt(8),
		})

		const result = await loading

		expect(result.totals.recitedAyahs).toBe(1212)
		expect(result.daily.at(-1)?.recitedAyahs).toBe(12)
		expect(dbMock.tSystemStatistics.findUnique).toHaveBeenCalledTimes(2)
	})

	it('rebuilds the cache when Tehran enters a new day', async () => {
		await statisticsService_getLandingStatistics(now)
		await statisticsService_getLandingStatistics(new Date('2026-08-11T21:00:00.000Z'))

		expect(dbMock.tSystemStatistics.findUnique).toHaveBeenCalledTimes(2)
		expect(dbMock.tDailyStatistics.findMany).toHaveBeenCalledTimes(2)
	})

	it('uses Tehran calendar dates and writes both aggregate rows atomically', async () => {
		const tx = { $executeRaw: vi.fn().mockResolvedValue(1) }

		expect(statisticsService_getTehranDay(new Date('2026-08-11T21:00:00.000Z'))).toBe('2026-08-12')
		await statisticsService_increment(tx as never, { recitedAyahs: 10, completedRounds: 1 }, now)

		expect(tx.$executeRaw).toHaveBeenCalledTimes(2)
	})
})
